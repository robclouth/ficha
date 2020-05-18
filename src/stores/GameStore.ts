import localforage from "localforage";
import { omit } from "lodash";
import { action, computed, observable, reaction } from "mobx";
import {
  applyPatches,
  applySnapshot,
  clone,
  fromSnapshot,
  getRootStore,
  getSnapshot,
  model,
  Model,
  modelAction,
  modelFlow,
  onPatches,
  OnPatchesDisposer,
  Patch,
  prop,
  Ref,
  SnapshotInOf,
  _async,
  _await,
  SnapshotOutOf
} from "mobx-keystone";
import { nanoid } from "nanoid";
import Peer, { DataConnection } from "peerjs";
import GameServer, { StateData, StateDataType } from "../models/GameServer";
import GameState, { gameStateRef } from "../models/GameState";
import Player from "../models/Player";
import { generateName } from "../utils/NameGenerator";
import persist from "../utils/Persistence";
import { withoutUndo } from "../utils/UndoMiddleware";
import { generateId } from "../utils/Utils";
import RootStore from "./RootStore";
import delay from "delay";
import { appUrl } from "../constants/constants";
import { Game } from "./GameLibrary";

const FATAL_ERRORS = [
  "invalid-id",
  "invalid-key",
  "network",
  "ssl-unavailable",
  "server-error",
  "socket-error",
  "socket-closed",
  "unavailable-id",
  "webrtc"
];

@model("GameStore")
export default class GameStore extends Model({
  gameState: prop<GameState>(() => new GameState({}), {
    setterAction: true
  }),
  currentGameId: prop<string | undefined>(undefined, {
    setterAction: true
  })
}) {
  userId?: string;
  userName?: string;
  @observable isInitialised = false;
  @observable isLoading = false;
  @observable peer?: Peer;
  @observable hostPeerId?: string;
  @observable serverConnection?: DataConnection;
  @observable isConnectedToPeerServer = false;
  @observable isConnectedToHost = false;
  @observable gameServer: GameServer | null = null;
  peerServerReconnectTimer?: NodeJS.Timeout;
  hostReconnectTimer?: NodeJS.Timeout;

  localStatePatchDisposer: OnPatchesDisposer = () => {};

  onInit() {}

  @modelFlow
  init = _async(function*(this: GameStore) {
    this.userId = yield* _await(localforage.getItem<string>("userId"));
    if (!this.userId) {
      this.userId = nanoid();
      yield* _await(localforage.setItem("userId", this.userId));
    }
    this.userName = yield* _await(localforage.getItem<string>("userName"));
    if (!this.userName) {
      this.userName = generateName();
      yield* _await(localforage.setItem("userName", this.userName));
    }

    const hasHydrated = yield* _await(persist(this, "gameStore"));

    if (!hasHydrated) {
      this.gameLibrary.newGame();
    }

    reaction(
      () => getSnapshot(this.gameState),
      snapshot =>
        this.currentGameId &&
        this.gameLibrary.saveInProgressGame(this.currentGameId, snapshot),
      { delay: 1000 }
    );

    // add a player for this user
    if (!this.thisPlayer) {
      this.gameState.addPlayer(
        new Player({
          userId: this.userId!,
          name: this.userName!
        })
      );
    }

    this.thisPlayer.isConnected = true;

    // disconnect all saved players
    this.gameState.players.forEach(player => {
      if (player.userId !== this.userId) player.isConnected = false;
    });

    this.uiState.setupUndoManager(this.gameState);

    this.isInitialised = true;
  });

  @computed get uiState() {
    return getRootStore<RootStore>(this)?.uiState!;
  }

  @computed get gameLibrary() {
    return getRootStore<RootStore>(this)?.gameLibrary!;
  }

  @computed get isHost(): boolean {
    return this.gameServer !== null;
  }

  @computed get thisPlayer(): Player {
    return this.gameState.players.find(p => p.userId === this.userId)!;
  }

  @computed get peerId(): string | undefined {
    return this.peer?.id;
  }

  @computed get gameUrl(): string | undefined {
    return `${appUrl}/#/${this.hostPeerId}`;
  }

  @computed get isConnected() {
    return (
      this.isConnectedToPeerServer && (this.isHost || this.isConnectedToHost)
    );
  }

  @modelFlow
  startHosting = _async(function*(this: GameStore) {
    this.isLoading = true;

    this.destroyPeer();
    yield* _await(this.createPeer());
    this.hostPeerId = this.peer!.id;

    this.thisPlayer.peerId = this.peer!.id;

    this.gameServer = new GameServer({});

    yield* _await(this.gameServer.setup(this.peer!, this.gameState));

    this.trackLocalState(true);

    this.isLoading = false;
  });

  stopHosting() {
    this.gameServer && this.gameServer.close();
    this.gameServer = null;
    this.destroyPeer();
  }

  @modelAction
  toggleHosting() {
    if (!this.isHost) {
      this.startHosting();
    } else {
      this.stopHosting();
    }
  }

  @modelFlow
  joinGame = _async(function*(this: GameStore, hostPeerId: string) {
    this.destroyPeer();
    yield* _await(this.createPeer());

    this.hostPeerId = hostPeerId.toUpperCase();
    this.isLoading = true;
    this.gameServer?.close();
    this.gameServer = null;
    this.isConnectedToHost = false;
    this.serverConnection = yield* _await(this.connectToGame());
    this.isConnectedToHost = true;

    this.uiState.showMessage({
      text: "Connected",
      options: {
        variant: "success",
        preventDuplicate: true
      }
    });

    this.trackLocalState(true);

    this.isLoading = false;

    this.serverConnection.on("data", stateData =>
      this.onStateDataFromServer(stateData as StateData)
    );
    this.serverConnection.on("close", () => {
      this.handleHostDisconnect();
    });
  });

  @modelAction
  leaveGame() {
    const serverConnection = this.serverConnection as any;
    if (serverConnection) {
      serverConnection.removeAllListeners("data");
      serverConnection.removeAllListeners("close");
      serverConnection?.close();
    }

    this.hostReconnectTimer && clearInterval(this.hostReconnectTimer);
    this.isConnectedToHost = false;
    this.serverConnection = undefined;
    this.isConnectedToHost = false;

    this.destroyPeer();
  }

  @modelAction
  destroyPeer() {
    this.peerServerReconnectTimer &&
      clearInterval(this.peerServerReconnectTimer);
    this.isConnectedToPeerServer = false;
    this.peer?.destroy();
    this.hostPeerId = undefined;

    this.gameState.connectedPlayers.forEach(player => {
      if (player !== this.thisPlayer) player.isConnected = false;
    });
  }

  @modelAction
  handleHostDisconnect() {
    // set all other players to disconnected
    this.gameState.players.forEach(p => {
      if (p !== this.thisPlayer) p.isConnected = false;
    });

    this.reconnectToHost();

    this.uiState.showMessage({
      text: "Connection to host lost. Retrying...",
      options: {
        variant: "error",
        preventDuplicate: true
      }
    });
  }

  @action async createPeer() {
    this.peer = await new Promise<Peer>((resolve, reject) => {
      const peer = new Peer(generateId(), {
        host: "llllllll.link",
        port: 9000,
        secure: true,
        path: "/peer",
        config: {
          iceServers: [
            {
              urls: "stun:llllllll.link:443",
              username: "ficha",
              credential: "R0J3Y88GsjVYvbdI8m6H"
            },
            {
              urls: "turn:llllllll.link:443",
              username: "ficha",
              credential: "R0J3Y88GsjVYvbdI8m6H"
            }
          ],
          iceTransportPolicy: "all"
        }
        // debug: 3
      });

      peer.on("open", id => {
        resolve(peer);
      });

      peer.on("error", err => {
        reject(err);
      });
    });

    this.isConnectedToPeerServer = true;

    this.peer.on("error", err => {
      if (FATAL_ERRORS.includes(err.type)) {
        this.reconnectToHost();
        this.uiState.showMessage({
          text: "Connection lost. Retrying...",
          options: {
            variant: "error",
            preventDuplicate: true
          }
        });
      } else {
        this.uiState.showMessage({
          text: err.message.replace(/peer/g, "game"),
          options: {
            variant: "error",
            preventDuplicate: true
          }
        });
        if (err.type === "peer-unavailable") {
          this.leaveGame();
        }
        console.log("Non fatal error: ", err.type);
      }
    });

    this.peer.on("disconnected", () => {
      if (this.isConnectedToPeerServer) {
        this.reconnectToPeerServer();

        this.uiState.showMessage({
          text: "Connection lost. Retrying...",
          options: {
            variant: "error",
            preventDuplicate: true
          }
        });
      }
    });
  }

  async reconnectToPeerServer() {
    this.isConnectedToPeerServer = false;
    this.peerServerReconnectTimer = setInterval(
      () => this.peer?.reconnect(),
      5000
    );
  }

  async reconnectToHost() {
    this.isConnectedToHost = false;
    this.hostReconnectTimer = setInterval(() => this.connectToGame(), 5000);
  }

  async connectToGame() {
    const connection = await new Promise<DataConnection>((resolve, reject) => {
      const connection = this.peer!.connect(this.hostPeerId!, {
        metadata: { userId: this.userId, userName: this.userName }
      });

      if (!connection) reject("Connection failed");

      connection.on("open", () => {
        resolve(connection);
      });

      connection.on("error", err => {
        reject(err);
      });
    });

    return connection;
  }

  trackLocalState(shouldTrack: boolean) {
    if (shouldTrack) {
      this.localStatePatchDisposer = onPatches(
        this.gameState,
        (patches, inversePatches) => {
          if (this.isHost) this.gameServer!.sendStateToClients(patches);
          else
            this.sendStateToServer({
              type: StateDataType.Partial,
              data: patches
            });
        }
      );
    } else this.localStatePatchDisposer();
  }

  @modelAction
  onStateDataFromServer(stateData: StateData) {
    this.trackLocalState(false);
    withoutUndo(() => {
      if (stateData.type === StateDataType.Partial) {
        applyPatches(this.gameState, stateData.data as Patch[]);
      } else {
        this.gameState = fromSnapshot<GameState>(
          stateData.data as SnapshotInOf<GameState>
        );
        this.uiState.setupUndoManager(this.gameState);
      }
    });
    this.trackLocalState(true);
  }

  sendStateToServer(stateData: StateData) {
    this.serverConnection && this.serverConnection.send(stateData);
  }

  updateCurrentGameLibraryEntry() {
    if (this.currentGameId)
      this.gameLibrary.updateGameFromState(
        this.currentGameId,
        getSnapshot(this.gameState)
      );
  }

  @modelAction
  playGame(game: Game, gameStateSnapshot: SnapshotOutOf<GameState>) {
    // update the previous game in the game library
    this.updateCurrentGameLibraryEntry();

    // if currently playing a game close it
    this.serverConnection && this.serverConnection.close();
    this.gameServer && this.gameServer.close();
    this.hostPeerId = undefined;

    this.currentGameId = game.$modelId;

    applySnapshot(this.gameState, {
      ...gameStateSnapshot,
      $modelId: this.gameState.$modelId
    });

    // add a player for this user
    if (!this.thisPlayer) {
      this.gameState.addPlayer(
        new Player({
          userId: this.userId!,
          name: this.userName!
        })
      );
    }

    this.uiState.setupUndoManager(this.gameState);
  }
}
