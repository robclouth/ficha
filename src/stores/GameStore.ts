import localforage from "localforage";
import { omit } from "lodash";
import { computed, observable, reaction } from "mobx";
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
  getRootStore
} from "mobx-keystone";
import { nanoid } from "nanoid";
import Peer, { DataConnection, util } from "peerjs";
import GameServer, { StateData, StateDataType } from "../models/GameServer";
import GameState from "../models/GameState";
import Player from "../models/Player";
import { generateName } from "../utils/NameGenerator";
import { createPeer } from "../utils/Utils";
import {
  undoMiddleware,
  UndoManager,
  withoutUndo
} from "../utils/undoMiddleware";
import { gameRepoUrl } from "../constants/constants";
import RootStore from "./RootStore";

@model("GameStore")
export default class GameStore extends Model({
  gameServer: prop<GameServer | null>(null, { setterAction: true }),
  gameState: prop<GameState>(() => new GameState({}), {
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
  @observable connectionError: string | null = null;

  localStatePatchDisposer: OnPatchesDisposer = () => {};

  @modelFlow
  init = _async(function*(this: GameStore) {
    // yield* _await(localforage.clear());

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

    const gameStoreJson = yield* _await(
      localforage.getItem<SnapshotOutOf<GameStore>>("gameStore")
    );
    if (gameStoreJson) {
      applySnapshot(this, { ...gameStoreJson, $modelId: this.$modelId });

      this.gameState.players.forEach(player => {
        if (player.userId !== this.userId) player.isConnected = false;
      });

      this.uiState.setupUndoManager(this.gameState);
    } else {
      this.gameState = new GameState({});

      this.newGame();

      this.gameState.addPlayer(
        new Player({
          userId: this.userId!,
          name: this.userName!
        })
      );
    }

    reaction(
      () => getSnapshot(this),
      snapshot => {
        localforage.setItem("gameStore", snapshot);
      },
      { delay: 1000 }
    );

    this.isInitialised = true;
  });

  @computed get uiState() {
    return getRootStore<RootStore>(this)?.uiState!;
  }

  @computed get isHost(): boolean {
    return this.gameServer !== null;
  }

  @computed get player(): Player {
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

    let thisPlayer = this.gameState.players.find(p => p.userId === this.userId);

    if (!thisPlayer) {
      thisPlayer = new Player({
        userId: this.userId!,
        name: this.userName!
      });
      this.gameState.addPlayer(thisPlayer);
    }

    thisPlayer.peerId = this.peer!.id;

    this.gameServer = new GameServer({});

    yield* _await(this.gameServer.setup(this.peer!, this.gameState));

    this.trackLocalState(true);

    this.isLoading = false;
  });

  @modelFlow
  joinGame = _async(function*(this: GameStore, hostPeerId: string) {
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
      if (p !== this.player) p.isConnected = false;
    });

    // remove entity control of all players
    this.gameState.entities.forEach(entity => {
      if (entity.controllingPeerId !== this.peerId)
        entity.controllingPeerId = undefined;
    });

    // create a new server and pass in the old local state
    this.gameServer = new GameServer({});
    yield* _await(this.gameServer.setup(this.peer!, this.gameState));

    this.connectionError = "The host disconnected";
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

  @modelAction
  newGame() {
    this.gameState.removeAllEntities();
    this.gameState.setups = [];
    this.gameState.rules = [
      "Write the rules of the game here using [Markdown](https://www.markdownguide.org/basic-syntax/)"
    ];
    this.uiState.setupUndoManager(this.gameState);
  }

  @modelFlow
  loadGameFromUrl = _async(function*(this: GameStore, url: string) {
    const response = yield* _await(fetch(`${url}/game.json`));
    const gameJson = yield* _await(response.json());

    const gameState = fromSnapshot<GameState>(gameJson);
    this.gameState.name = gameState.name;
    this.gameState.assetsUrl = gameState.assetsUrl;
    this.gameState.setups = clone(gameState.setups);
    if (gameState.activeSetup)
      this.gameState.activeSetup = clone(gameState.activeSetup);
    this.gameState.entities = clone(gameState.entities);
  });

  @modelAction
  loadGameByName(name: string) {
    this.loadGameFromUrl(gameRepoUrl + "/" + name);
  }

  @modelAction
  exportGame() {
    const gameState = clone(this.gameState);
    const gameStateJson = getSnapshot(gameState);

    const cleanedJson = omit(gameStateJson, [
      "players",
      "hostPeerId",
      "chatHistory",
      "players"
    ]);

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
