import { action, observable, reaction } from "mobx";
import {
  getSnapshot,
  onPatches,
  Patch,
  SnapshotOutOf,
  applyPatches
} from "mobx-keystone";
import localforage from "localforage";
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
  @observable hostingPlayer!: Player;
  @observable gameState!: GameState;
  @observable lastJson: any;

  ignorePlayerIdInStateUpdate?: string;

  async setup(hostingPlayer: Player, peer: Peer) {
    this.hostingPlayer = hostingPlayer;
    this.peer = peer;
    this.gameState = new GameState({ hostPeerId: this.peerId });
    this.gameState.addPlayer(this.hostingPlayer);

    onPatches(this.gameState, (patches, inversePatches) => {
      this.sendStateToClients(patches);
    });

    reaction(
      () => getSnapshot(this.gameState),
      snapshot => {
        localforage.setItem("serverState", snapshot);
      },
      { delay: 1000 }
    );

    this.peer.on("connection", connection => {
      connection.on("open", () => {
        const player = new Player({
          id: connection.metadata.userId,
          peerId: connection.peer
        });
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
    for (let i = 0; i < 52; i++) deck.addCard(new Card({}));
    this.gameState.addEntity(deck);
  }

  get peerId() {
    return this.peer?.id;
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
