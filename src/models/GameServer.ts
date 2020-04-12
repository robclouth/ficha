import { observable, computed, action, autorun, reaction } from "mobx";
import Peer, { DataConnection } from "peerjs";
import Player from "./Player";
import { createPeer } from "../utils/Utils";
import GameState from "./GameState";
import { serialize } from "serializr";

export default class GameServer {
  @observable peer!: Peer;
  @observable gameState = new GameState();
  @observable lastJson: any;

  async setup() {
    reaction(
      () => serialize(this.gameState),
      json => {
        this.lastJson = json;
        this.synchronizeState(json);
      }
    );

    this.peer = await createPeer();

    this.peer.on("connection", connection => {
      connection.on("open", () => {
        const player = new Player();
        player.id = connection.peer;
        player.connection = connection;

        this.gameState.addPlayer(player);
        player.sendGameState(this.lastJson);

        connection.on("data", data => this.gameState.handleAction(data));
        connection.on("close", () => this.gameState.removePlayer(player));
      });
    });

    this.peer.on("disconnected", () => this.peer.reconnect());
  }

  get gameId() {
    return this.peer.id;
  }

  @action synchronizeState(json: any) {
    for (let player of this.gameState.players) {
      player.sendGameState(json);
    }
  }
}
