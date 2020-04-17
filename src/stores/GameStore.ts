import { computed, observable } from "mobx";
import {
  applyPatches,
  fromSnapshot,
  onPatches,
  OnPatchesDisposer,
  Patch,
  SnapshotInOf,
  modelFlow,
  _async,
  _await,
  model,
  Model,
  prop,
  modelAction
} from "mobx-keystone";
import localforage from "localforage";
import Peer, { DataConnection } from "peerjs";
import GameServer, { StateData, StateDataType } from "../models/GameServer";
import GameState from "../models/GameState";
import Player from "../models/Player";
import { createPeer } from "../utils/Utils";
import RootStore from "./RootStore";
import GameDefinition from "../models/GameDefinition";
import { nanoid } from "nanoid";
import { generateName } from "../utils/NameGenerator";

@model("GameStore")
export default class GameStore extends Model({}) {
  userId?: string;
  userName?: string;
  @observable isInitialised = false;
  @observable isLoading = false;
  @observable peer?: Peer;
  @observable hostPeerId?: string;
  @observable gameServer: GameServer | null = null;
  @observable serverConnection?: DataConnection;
  @observable localGameState = new GameState({});
  @observable connectionError: string | null = null;

  localStatePatchDisposer: OnPatchesDisposer = () => {};

  @modelFlow
  init = _async(function*(this: GameStore) {
    this.userId = yield* _await(localforage.getItem<string>("userId"));
    if (!this.userId) {
      this.userId = nanoid();
      yield* _await(localforage.setItem("userId", this.userId));
    }
    this.userName = yield* _await(localforage.getItem<string>("userName"));
    if (!this.userName) {
      this.userName = generateName();
      yield* _await(localforage.setItem("userName", this.userName));
    }

    this.isInitialised = true;
  });

  @computed get gameState(): GameState {
    return this.isHost ? this.gameServer!.gameState : this.localGameState;
  }

  @computed get isHost(): boolean {
    return this.gameServer !== null;
  }

  @computed get player(): Player {
    return this.gameState.players.find(p => p.userId === this.userId)!;
  }

  @modelFlow
  createGame = _async(function*(this: GameStore) {
    this.isLoading = true;

    this.peer = yield* _await(createPeer());
    this.hostPeerId = this.peer!.id;

    const player = new Player({
      userId: this.userId!,
      peerId: this.peer!.id,
      name: this.userName!
    });

    this.gameServer = new GameServer();
    yield* _await(this.gameServer.setup(player, this.peer!));
    this.isLoading = false;
  });

  @modelFlow
  joinGame = _async(function*(this: GameStore, hostPeerId: string) {
    this.hostPeerId = hostPeerId;
    this.isLoading = true;
    this.gameServer = null;
    this.serverConnection = yield* _await(this.connectToGame());
    this.isLoading = false;
    this.serverConnection.on("data", stateData =>
      this.onStateDataFromServer(stateData as StateData)
    );
    this.serverConnection.on("close", () => {
      this.handleHostDisconnect();
    });
  });

  @modelFlow
  handleHostDisconnect = _async(function*(this: GameStore) {
    this.trackLocalState(false);

    this.localGameState.players.forEach(p => {
      if (p !== this.player) p.isConnected = false;
    });

    // create a new server and pass in the old local state
    this.gameServer = new GameServer();
    yield* _await(
      this.gameServer.setup(this.player, this.peer!, this.localGameState)
    );

    this.connectionError = "The host disconnected";
  });

  connectToGame() {
    return new Promise<DataConnection>((resolve, reject) => {
      const connection = this.peer!.connect(this.hostPeerId!, {
        metadata: { userId: this.userId, userName: this.userName }
      });

      connection.on("open", () => {
        resolve(connection);
      });
      connection.on("error", err => {
        reject(err);
      });
    });
  }

  trackLocalState(shouldTrack: boolean) {
    if (shouldTrack) {
      this.localStatePatchDisposer = onPatches(
        this.localGameState,
        (patches, inversePatches) => {
          this.sendStateToServer({
            type: StateDataType.Partial,
            data: patches
          });
        }
      );
    } else this.localStatePatchDisposer();
  }

  @modelAction
  onStateDataFromServer(stateData: StateData) {
    this.trackLocalState(false);
    if (stateData.type === StateDataType.Partial) {
      applyPatches(this.localGameState, stateData.data as Patch[]);
    } else {
      this.localGameState = fromSnapshot<GameState>(
        stateData.data as SnapshotInOf<GameState>
      );
    }
    this.trackLocalState(true);
  }

  sendStateToServer(stateData: StateData) {
    this.serverConnection && this.serverConnection.send(stateData);
  }

  @modelFlow
  loadGameStateFromUrl = _async(function*(this: GameStore, url: string) {
    const response = yield* _await(fetch(`${url}/game.json`));
    const gameDefinitionJson = yield* _await(response.json());
    const gameDefinition = new GameDefinition({
      ...gameDefinitionJson,
      baseUrl: url
    });
    const checkError = gameDefinition.typeCheck();

    if (checkError !== null) checkError.throw(gameDefinitionJson);

    this.gameState.entities = gameDefinition.entities;
  });
}
