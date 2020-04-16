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

export default class GameStore {
  userId?: string;
  @observable isInitialised = false;
  @observable isConnecting = false;
  @observable peer?: Peer;
  @observable hostPeerId?: string;
  @observable gameServer: GameServer | null = null;
  @observable serverConnection?: DataConnection;
  @observable localGameState = new GameState({});

  localStatePatchDisposer: OnPatchesDisposer = () => {};

  constructor(private rootStore: RootStore) {}

  @action async init() {
    this.userId = await localforage.getItem("userId");
    if (!this.userId) {
      this.userId = nanoid();
      await localforage.setItem("userId", this.userId);
    }

    this.peer = await createPeer();

    this.isInitialised = true;
  }

  @computed get gameState(): GameState {
    return this.isHost ? this.gameServer!.gameState : this.localGameState;
  }

  @computed get isHost(): boolean {
    return this.gameServer !== null;
  }

  @computed get isNextHost(): boolean {
    return this.nextHostPeerId === this.userId;
  }

  @computed get nextHostPeerId(): string | null {
    const playersWithoutHost = this.gameState.players.filter(
      p => p.peerId !== this.hostPeerId
    );
    return playersWithoutHost.length > 0 ? playersWithoutHost[0].id : null;
  }

  @computed get player(): Player {
    return this.gameState.players.find(p => p.id === this.userId)!;
  }

  @action async createGame() {
    this.isConnecting = true;

    const player = new Player({
      id: this.userId!,
      peerId: this.peer!.id
    });

    this.gameServer = new GameServer();
    await this.gameServer.setup(player, this.peer!);
    this.isConnecting = false;
  }

  @action async joinGame(hostPeerId: string) {
    this.hostPeerId = hostPeerId;
    this.isConnecting = true;
    this.gameServer = null;
    this.serverConnection = await this.connectToGame();
    this.isConnecting = false;
    this.serverConnection.on("data", stateData =>
      this.onStateDataFromServer(stateData as StateData)
    );
    this.serverConnection.on("close", () => {
      this.handleHostDisconnect();
    });
  }

  handleHostDisconnect() {
    if (this.isNextHost) {
    } else {
      if (this.nextHostPeerId) this.joinGame(this.nextHostPeerId);
      else this.createGame();
    }
  }

  connectToGame() {
    return new Promise<DataConnection>((resolve, reject) => {
      const connection = this.peer!.connect(this.hostPeerId!, {
        metadata: { userId: this.userId }
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
