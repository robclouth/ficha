import { action, observable } from "mobx";
import {
  applyPatches,
  getSnapshot,
  model,
  Model,
  modelFlow,
  Patch,
  SnapshotOutOf,
  _async
} from "mobx-keystone";
import Peer, { DataConnection } from "peerjs";
import GameState from "./GameState";
import Player from "./Player";

export enum StateDataType {
  Full,
  Partial
}

export type StateData = {
  type: StateDataType;
  data: SnapshotOutOf<GameState> | Patch[];
};

@model("GameServer")
export default class GameServer extends Model({}) {
  @observable peer!: Peer;
  @observable lastJson: any;
  @observable gameState!: GameState;

  ignorePlayerIdInStateUpdate?: string;

  @modelFlow
  setup = _async(function*(this: GameServer, peer: Peer, gameState: GameState) {
    this.peer = peer;
    this.gameState = gameState;

    this.peer.on("connection", connection => {
      this.handlePlayerConnected(connection);
    });
  });

  @action handlePlayerConnected(connection: DataConnection) {
    connection.on("open", () => {
      this.handleConnectionOpened(connection);
    });
  }

  @action handleConnectionOpened(connection: DataConnection) {
    // if the user was previously in game, they take control of that player
    const { userId, userName } = connection.metadata;

    let player = this.gameState.players.find(p => p.userId === userId);

    if (player) {
      // close existing connection
      if (player.connection) {
        const connection = player.connection as any;
        connection.removeAllListeners("data");
        connection.removeAllListeners("error");
        connection.removeAllListeners("close");
      }
      player.isConnected = true;
    } else {
      player = new Player({
        userId,
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

    this. .showMessage({
      text: "Connected",
      options: {
        variant: "success",
        preventDuplicate: true
      }
    });

    connection.on("data", data =>
      this.handleStateDataFromClient(data, player!)
    );
    connection.on("error", err => this.handleConnectionError(err));
    connection.on("close", () => this.handlePlayerDisconnect(player!));
  }

  get peerId() {
    return this.peer?.id;
  }

  @action handleConnectionError(err: string) {
    console.log(err);
  }

  @action handlePlayerDisconnect(player: Player) {
    // remove control of all entities they were controlling
    this.gameState.entities.forEach(entity => {
      if (entity.controllingUserId === player.peerId)
        entity.controllingUserId = undefined;
    });
    player.isConnected = false;
  }

  @action sendStateToClients(patches: Patch[]) {
    for (let player of this.gameState.connectedPlayers) {
      if (
        player.peerId === this.peerId ||
        player.userId === this.ignorePlayerIdInStateUpdate
      ) {
        continue;
      }
      player.sendState({
        type: StateDataType.Partial,
        data: patches
      });
    }
  }

  @action handleStateDataFromClient(stateData: StateData, fromPlayer: Player) {
    if (stateData.type === StateDataType.Partial) {
      this.ignorePlayerIdInStateUpdate = fromPlayer.userId;
      applyPatches(this.gameState, stateData.data as Patch[]);
      this.ignorePlayerIdInStateUpdate = undefined;
    }
  }

  @action close() {
    this.gameState.connectedPlayers.forEach(
      player => player.connection && player.connection.close()
    );

    this.peer.off("connection", this.handlePlayerConnected);
  }
}
