import { action, observable } from "mobx";
import {
  getSnapshot,
  onPatches,
  Patch,
  SnapshotOutOf,
  applyPatches
} from "mobx-keystone";
import Peer from "peerjs";
import { createPeer } from "../utils/Utils";
import GameState from "./GameState";
import Player from "./Player";
import Deck from "./game/Deck";
import Card from "./game/Card";

export enum StateDataType {
  Full,
  Partial
}

export type StateData = {
  type: StateDataType;
  data: SnapshotOutOf<GameState> | Patch[];
};

export default class GameServer {
  @observable peer!: Peer;
  @observable gameState = new GameState({});
  @observable lastJson: any;

  ignorePlayerIdInStateUpdate?: string;

  async setup() {
    const disposer = onPatches(this.gameState, (patches, inversePatches) => {
      this.sendStateToClients(patches);
    });

    this.peer = await createPeer();

    this.peer.on("connection", connection => {
      connection.on("open", () => {
        const player = new Player({ id: connection.peer });
        player.connection = connection;

        this.gameState.addPlayer(player);
        player.sendState({
          type: StateDataType.Full,
          data: getSnapshot(this.gameState)
        });

        connection.on("data", data => this.onStateDataFromClient(data, player));
        connection.on("close", () => this.gameState.removePlayer(player));
      });
    });

    this.peer.on("disconnected", () => this.peer.reconnect());

    const deck = new Deck({});
    deck.addCard(new Card({}));
    this.gameState.addEntity(deck);
  }

  get gameId() {
    return this.peer.id;
  }

  @action sendStateToClients(patches: Patch[]) {
    for (let player of this.gameState.players) {
      if (player.id === this.ignorePlayerIdInStateUpdate) continue;
      player.sendState({
        type: StateDataType.Partial,
        data: patches
      });
    }
  }

  @action onStateDataFromClient(stateData: StateData, fromPlayer: Player) {
    if (stateData.type === StateDataType.Partial) {
      this.ignorePlayerIdInStateUpdate = fromPlayer.id;
      applyPatches(this.gameState, stateData.data as Patch[]);
      this.ignorePlayerIdInStateUpdate = undefined;
    }
  }
}
