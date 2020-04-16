import { action, observable, reaction } from "mobx";
import {
  getSnapshot,
  onPatches,
  Patch,
  SnapshotOutOf,
  applyPatches,
  clone
} from "mobx-keystone";
import localforage from "localforage";
import Peer, { DataConnection } from "peerjs";
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

  constructor(hostingPlayer: Player, peer: Peer, gameState?: GameState) {
    this.setup(hostingPlayer, peer, gameState);
  }

  @action setup(hostingPlayer: Player, peer: Peer, gameState?: GameState) {
    this.hostingPlayer = hostingPlayer;
    this.peer = peer;

    if (gameState) {
      this.gameState = clone(gameState);
    } else {
      this.gameState = new GameState({});
      this.gameState.addPlayer(this.hostingPlayer);

      const deck = new Deck({});
      for (let i = 0; i < 52; i++) deck.addCard(new Card({}));
      this.gameState.addEntity(deck);
    }

    this.gameState.hostPeerId = this.peerId;

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
        this.handleConnectionOpened(connection);
      });
    });

    this.peer.on("disconnected", () => this.peer.reconnect());
  }

  @action handleConnectionOpened(connection: DataConnection) {
    // if the user was previously in game, they take control of that player
    const { userId, userName } = connection.metadata;
    let player = this.gameState.players.find(p => p.userId === userId);

    if (player) {
      player.isConnected = true;
    } else {
      player = new Player({
        userId: userId,
        name: userName,
        peerId: connection.peer,
        isConnected: true
      });
      this.gameState.addPlayer(player);
    }
    player.connection = connection;

    player.sendState({
      type: StateDataType.Full,
      data: getSnapshot(this.gameState)
    });

    connection.on("data", data => this.onStateDataFromClient(data, player!));
    connection.on("close", () => (player!.isConnected = false));
  }

  get peerId() {
    return this.peer?.id;
  }

  @action sendStateToClients(patches: Patch[]) {
    for (let player of this.gameState.connectedPlayers) {
      if (player.userId === this.ignorePlayerIdInStateUpdate) continue;
      player.sendState({
        type: StateDataType.Partial,
        data: patches
      });
    }
  }

  @action onStateDataFromClient(stateData: StateData, fromPlayer: Player) {
    if (stateData.type === StateDataType.Partial) {
      this.ignorePlayerIdInStateUpdate = fromPlayer.userId;
      applyPatches(this.gameState, stateData.data as Patch[]);
      this.ignorePlayerIdInStateUpdate = undefined;
    }
  }
}
