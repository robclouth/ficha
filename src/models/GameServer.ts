import { action, observable, reaction } from "mobx";
import {
  getSnapshot,
  onPatches,
  Patch,
  SnapshotOutOf,
  applyPatches,
  clone,
  SnapshotInOf,
  fromSnapshot,
  model,
  Model,
  modelFlow,
  _async,
  _await,
  prop
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

@model("GameServer")
export default class GameServer extends Model({
  gameState: prop<GameState>(() => new GameState({}), { setterAction: true })
}) {
  @observable peer!: Peer;
  @observable hostingPlayer!: Player;
  @observable lastJson: any;

  ignorePlayerIdInStateUpdate?: string;

  @modelFlow
  setup = _async(function*(
    this: GameServer,
    hostingPlayer: Player,
    peer: Peer,
    gameState?: GameState
  ) {
    this.hostingPlayer = hostingPlayer;
    this.peer = peer;

    if (gameState) {
      this.gameState = clone(gameState);
    } else {
      const gameStateJson = yield* _await(localforage.getItem("gameState"));
      const restoredGameState = gameStateJson
        ? fromSnapshot<GameState>(gameStateJson as SnapshotInOf<GameState>)
        : undefined;

      if (restoredGameState) this.gameState = restoredGameState;
      else {
        this.gameState = new GameState({});
        this.gameState.addPlayer(this.hostingPlayer);

        const deck1 = new Deck({});
        for (let i = 0; i < 52; i++) deck1.addCard(new Card({}));
        this.gameState.addEntity(deck1);

        const deck2 = new Deck({ position: [1, 0] });
        for (let i = 0; i < 52; i++) deck2.addCard(new Card({}));
        this.gameState.addEntity(deck2);
      }
    }

    this.gameState.hostPeerId = this.peerId;

    onPatches(this.gameState, (patches, inversePatches) => {
      this.sendStateToClients(patches);
    });

    reaction(
      () => getSnapshot(this.gameState),
      snapshot => {
        localforage.setItem("gameState", snapshot);
      },
      { delay: 1000 }
    );

    this.peer.on("connection", connection => {
      connection.on("open", () => {
        this.handleConnectionOpened(connection);
      });
    });

    this.peer.on("disconnected", () => this.peer.reconnect());
  });

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
