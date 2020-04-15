import { action, computed, observable } from "mobx";
import {
  applyPatches,
  fromSnapshot,
  onPatches,
  OnPatchesDisposer,
  Patch,
  SnapshotInOf
} from "mobx-keystone";
import Peer, { DataConnection } from "peerjs";
import GameServer, { StateData, StateDataType } from "../models/GameServer";
import GameState from "../models/GameState";
import Player from "../models/Player";
import { connectToPeer, createPeer } from "../utils/Utils";
import RootStore from "./RootStore";
import GameDefinition from "../models/GameDefinition";

export default class GameStore {
  @observable isInitialised = false;
  @observable isConnecting = false;
  @observable peer?: Peer;
  @observable gameId?: string;
  @observable gameServer?: GameServer;
  @observable serverConnection?: DataConnection;
  @observable gameState = new GameState({});

  localStatePatchDisposer: OnPatchesDisposer = () => {};

  constructor(private rootStore: RootStore) {}

  @action init() {
    this.isInitialised = true;
  }

  @computed get isHost(): boolean {
    return !!this.gameServer;
  }

  @computed get player(): Player {
    return this.gameState.players.find(p => p.id === this.peer!.id)!;
  }

  @action async createGame() {
    this.gameServer = new GameServer();
    await this.gameServer.setup();
    return this.gameServer.gameId;
  }

  @action async joinGame(gameId: string) {
    this.gameId = gameId;
    this.peer = await createPeer();
    this.serverConnection = await connectToPeer(this.peer, this.gameId!);
    this.serverConnection.on("data", stateData =>
      this.onStateDataFromServer(stateData as StateData)
    );
  }

  trackLocalState(shouldTrack: boolean) {
    if (shouldTrack) {
      this.localStatePatchDisposer = onPatches(
        this.gameState,
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
      applyPatches(this.gameState, stateData.data as Patch[]);
    } else {
      this.gameState = fromSnapshot<GameState>(
        stateData.data as SnapshotInOf<GameState>
      );
    }
    this.trackLocalState(true);
  }

  sendStateToServer(stateData: StateData) {
    this.serverConnection && this.serverConnection.send(stateData);
  }

  @action async loadGameFromUrl(url: string) {
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
