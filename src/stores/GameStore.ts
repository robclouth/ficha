import { computed, observable, reaction } from "mobx";
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
  modelAction,
  undoMiddleware,
  UndoManager,
  getSnapshot,
  UndoStore,
  applySnapshot,
  SnapshotOutOf,
  withoutUndo
} from "mobx-keystone";
// @ts-ignore
import randomColor from "random-material-color";
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
import Deck from "../models/game/Deck";
import Card from "../models/game/Card";

@model("GameStore")
export default class GameStore extends Model({
  gameServer: prop<GameServer | null>(null, { setterAction: true }),
  gameState: prop<GameState>(() => new GameState({}), {
    setterAction: true
  })
}) {
  userId?: string;
  userName?: string;
  @observable isInitialised = false;
  @observable isLoading = false;
  @observable peer?: Peer;
  @observable hostPeerId?: string;
  @observable serverConnection?: DataConnection;
  @observable connectionError: string | null = null;
  @observable undoManager!: UndoManager;

  localStatePatchDisposer: OnPatchesDisposer = () => {};

  @modelFlow
  init = _async(function*(this: GameStore) {
    yield* _await(localforage.clear());

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

    const gameStoreJson = yield* _await(
      localforage.getItem<SnapshotOutOf<GameStore>>("gameStore")
    );
    if (gameStoreJson) {
      applySnapshot(this, { ...gameStoreJson, $modelId: this.$modelId });

      this.gameState.players.forEach(player => {
        if (player.userId !== this.userId) player.isConnected = false;
      });
    } else {
      this.gameState = new GameState({});

      this.gameState.addPlayer(
        new Player({
          userId: this.userId!,
          name: this.userName!
        })
      );
    }

    reaction(
      () => getSnapshot(this),
      snapshot => {
        localforage.setItem("gameStore", snapshot);
      },
      { delay: 1000 }
    );

    this.undoManager = undoMiddleware(this.gameState.entities);

    this.isInitialised = true;
  });

  @computed get isHost(): boolean {
    return this.gameServer !== null;
  }

  @computed get player(): Player {
    return this.gameState.players.find(p => p.userId === this.userId)!;
  }

  @computed get peerId(): string | undefined {
    return this.peer?.id;
  }

  @modelFlow
  createGame = _async(function*(this: GameStore) {
    this.isLoading = true;

    this.peer = yield* _await(createPeer());
    this.hostPeerId = this.peer!.id;
    this.gameState.players.find(
      p => p.userId === this.userId
    )!.peerId = this.peer!.id;

    this.gameServer = new GameServer({});

    yield* _await(this.gameServer.setup(this.peer!, this.gameState));

    this.trackLocalState(true);

    this.isLoading = false;
  });

  @modelFlow
  joinGame = _async(function*(this: GameStore, hostPeerId: string) {
    this.hostPeerId = hostPeerId;
    this.isLoading = true;
    this.gameServer = null;
    this.serverConnection = yield* _await(this.connectToGame());

    this.trackLocalState(true);

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
    // set all other players to disconnected
    this.gameState.players.forEach(p => {
      if (p !== this.player) p.isConnected = false;
    });

    // remove entity control of all players
    this.gameState.entities.forEach(entity => {
      if (entity.controllingPeerId !== this.peerId)
        entity.controllingPeerId = undefined;
    });

    // create a new server and pass in the old local state
    this.gameServer = new GameServer({});
    yield* _await(this.gameServer.setup(this.peer!, this.gameState));

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
        this.gameState,
        (patches, inversePatches) => {
          if (this.isHost) this.gameServer!.sendStateToClients(patches);
          else
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
    withoutUndo(() => {
      if (stateData.type === StateDataType.Partial) {
        applyPatches(this.gameState, stateData.data as Patch[]);
      } else {
        this.gameState = fromSnapshot<GameState>(
          stateData.data as SnapshotInOf<GameState>
        );
        this.undoManager = undoMiddleware(this.gameState.entities);
      }
    });
    this.trackLocalState(true);
  }

  sendStateToServer(stateData: StateData) {
    this.serverConnection && this.serverConnection.send(stateData);
  }

  undo() {
    if (this.undoManager.canUndo) this.undoManager.undo();
  }

  redo() {
    if (this.undoManager.canRedo) this.undoManager.redo();
  }

  @computed get canUndo() {
    return this.undoManager.canUndo;
  }

  @computed get canRedo() {
    return this.undoManager.canRedo;
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
