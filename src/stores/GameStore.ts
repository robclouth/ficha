import { action, computed, observable } from "mobx";
import {
  applyPatches,
  fromSnapshot,
  onPatches,
  OnPatchesDisposer,
  Patch,
  SnapshotInOf
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

export default class GameStore {
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

  constructor(private rootStore: RootStore) {}

  @action async init() {
    this.userId = await localforage.getItem("userId");
    if (!this.userId) {
      this.userId = nanoid();
      await localforage.setItem("userId", this.userId);
    }
    this.userName = await localforage.getItem("userName");
    if (!this.userName) {
      this.userName = generateName();
      await localforage.setItem("userName", this.userName);
    }

    this.isInitialised = true;
  }

  @computed get gameState(): GameState {
    return this.isHost ? this.gameServer!.gameState : this.localGameState;
  }

  @computed get isHost(): boolean {
    return this.gameServer !== null;
  }

  @computed get player(): Player {
    return this.gameState.players.find(p => p.userId === this.userId)!;
  }

  @action async createGame() {
    this.isLoading = true;

    this.peer = await createPeer();
    this.hostPeerId = this.peer!.id;

    const player = new Player({
      userId: this.userId!,
      peerId: this.peer!.id,
      name: this.userName!
    });

    this.gameServer = new GameServer();
    await this.gameServer.setup(player, this.peer!);
    this.isLoading = false;
  }

  @action async joinGame(hostPeerId: string) {
    this.hostPeerId = hostPeerId;
    this.isLoading = true;
    this.gameServer = null;
    this.serverConnection = await this.connectToGame();
    this.isLoading = false;
    this.serverConnection.on("data", stateData =>
      this.onStateDataFromServer(stateData as StateData)
    );
    this.serverConnection.on("close", () => {
      this.handleHostDisconnect();
    });
  }

  @action async handleHostDisconnect() {
    this.trackLocalState(false);

    this.localGameState.players.forEach(p => {
      if (p !== this.player) p.isConnected = false;
    });

    // create a new server and pass in the old local state
    this.gameServer = new GameServer();
    await this.gameServer.setup(this.player, this.peer!, this.localGameState);

    this.connectionError = "The host disconnected";
  }

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

  @action onStateDataFromServer(stateData: StateData) {
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

  @action async loadGameStateFromUrl(url: string) {
    const response = await fetch(`${url}/game.json`);
    const gameDefinitionJson = await response.json();
    const gameDefinition = new GameDefinition({
      ...gameDefinitionJson,
      baseUrl: url
    });
    const checkError = gameDefinition.typeCheck();

    if (checkError !== null) checkError.throw(gameDefinitionJson);

    this.gameState.entities = gameDefinition.entities;
  }
}
