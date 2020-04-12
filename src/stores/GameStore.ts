import { observable, action, computed } from "mobx";
import RootStore from "./RootStore";
import Peer, { DataConnection } from "peerjs";
import GameServer from "../models/GameServer";
import Player from "../models/Player";
import { generateId, createPeer, connectToPeer } from "../utils/Utils";
import GameState from "../models/GameState";
import { update } from "serializr";

export default class GameStore {
  @observable isInitialised = false;
  @observable isConnecting = false;
  @observable peer?: Peer;
  @observable gameId?: string;
  @observable gameServer?: GameServer;
  @observable serverConnection?: DataConnection;
  @observable gameState = new GameState();

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

  @action async createOrJoinGame(gameId?: string) {
    if (!gameId) {
      this.gameServer = new GameServer();
      await this.gameServer.setup();
      this.gameId = this.gameServer.gameId;
    } else {
      this.gameId = gameId;
    }

    this.peer = await createPeer();
    this.serverConnection = await connectToPeer(this.peer, this.gameId!);
    this.serverConnection.on("data", data => this.handleGameStateUpdate(data));
  }

  @action handleGameStateUpdate(data: any) {
    update(GameState, this.gameState, data, () => {});
  }

  @action sendActionToServer(action: any) {
    this.serverConnection && this.serverConnection.send(action);
  }
}
