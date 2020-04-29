import localforage from "localforage";
import { omit } from "lodash";
import { computed, observable, reaction, autorun } from "mobx";
import {
  applyPatches,
  applySnapshot,
  clone,
  fromSnapshot,
  getSnapshot,
  model,
  Model,
  modelAction,
  modelFlow,
  onPatches,
  OnPatchesDisposer,
  Patch,
  prop,
  SnapshotInOf,
  SnapshotOutOf,
  _async,
  _await,
  getRootStore,
  SnapshotOutOfModel,
  Ref,
  onSnapshot
} from "mobx-keystone";
import { nanoid } from "nanoid";
import gameListUrls from "../constants/gameList";
import Peer, { DataConnection, util } from "peerjs";
import GameServer, { StateData, StateDataType } from "../models/GameServer";
import GameState, { gameStateRef } from "../models/GameState";
import Player from "../models/Player";
import { generateName } from "../utils/NameGenerator";
import { createPeer, loadJson } from "../utils/Utils";
import {
  undoMiddleware,
  UndoManager,
  withoutUndo
} from "../utils/undoMiddleware";
import { gameRepoUrl, serverRoot } from "../constants/constants";
import RootStore from "./RootStore";
import persist from "../utils/persistent";

@model("GameStore")
export default class GameStore extends Model({
  gameServer: prop<GameServer | null>(null, { setterAction: true }),
  gameState: prop<GameState>(() => new GameState({}), {
    setterAction: true
  }),

  currentGame: prop<Ref<GameState> | undefined>(undefined, {
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

  @modelFlow
  createGame = _async(function*(this: GameStore) {
    this.isLoading = true;

    this.peer = yield* _await(createPeer());
    this.hostPeerId = this.peer!.id;

    this.thisPlayer.peerId = this.peer!.id;

    this.gameServer = new GameServer({});

    yield* _await(this.gameServer.setup(this.peer!, this.gameState));

    this.trackLocalState(true);

    this.isLoading = false;
  });

  @modelFlow
  joinGame = _async(function*(this: GameStore, hostPeerId: string) {
    if (!this.peer) this.peer = yield* _await(createPeer());

    this.hostPeerId = hostPeerId;
    this.isLoading = true;
    this.gameServer = null;
    this.serverConnection = yield* _await(this.connectToGame());

    this.trackLocalState(true);

    this.isLoading = false;

    this.serverConnection.on("data", stateData =>
      this.onStateDataFromServer(stateData as StateData)
    );
    this.serverConnection.on("close", () => {
      this.handleHostDisconnect();
    });
  });

  @modelFlow
  handleHostDisconnect = _async(function*(this: GameStore) {
    // set all other players to disconnected
    this.gameState.players.forEach(p => {
      if (p !== this.thisPlayer) p.isConnected = false;
    });

    // remove entity control of all players
    this.gameState.entities.forEach(entity => {
      if (entity.controllingPeerId !== this.peerId)
        entity.controllingPeerId = undefined;
    });

    // create a new server and pass in the old local state
    this.gameServer = new GameServer({});
    yield* _await(this.gameServer.setup(this.peer!, this.gameState));

    this.uiState.showMessage({
      text: "The host disconnected",
      options: {
        variant: "error",
        preventDuplicate: true
      }
    });
  });

  connectToGame() {
    return new Promise<DataConnection>((resolve, reject) => {
      const connection = this.peer!.connect(this.hostPeerId!, {
        metadata: { userId: this.userId, userName: this.userName }
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
    const game = this.currentGame?.maybeCurrent;
    if (game) {
      applySnapshot(game, {
        ...getSnapshot<GameState>(this.gameState),
        $modelId: game.$modelId
      });
    }
  }

  @modelAction
  playGame(game: GameState) {
    // update the previous game in the game library
    this.updateCurrentGameLibraryEntry();

    // if currently playing a game close it
    this.serverConnection && this.serverConnection.close();
    this.gameServer && this.gameServer.close();

    this.currentGame = gameStateRef(game);

    applySnapshot(this.gameState, {
      ...getSnapshot(game),
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

  @modelAction
  exportGame() {
    const gameState = clone(this.gameState);
    const gameStateJson = getSnapshot(gameState);

    const cleanedJson = omit(gameStateJson, ["players", "chatHistory"]);

    const blob = new Blob([JSON.stringify(cleanedJson)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `game.json`;
    a.click();
  }
}
