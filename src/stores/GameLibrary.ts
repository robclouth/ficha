import { computed, observable } from "mobx";
import {
  clone,
  fromSnapshot,
  getRootStore,
  model,
  Model,
  modelAction,
  modelFlow,
  prop,
  SnapshotOutOfModel,
  _async,
  _await,
  detach,
  getSnapshot,
  SnapshotOutOf
} from "mobx-keystone";
import localforage from "localforage";
import { pick } from "lodash";
import { gameRepoUrl, serverRoot } from "../constants/constants";
import gameList from "../constants/gameList";
import GameState from "../models/GameState";
import persist from "../utils/Persistence";
import { loadJson } from "../utils/Utils";
import GameStore from "./GameStore";
import RootStore from "./RootStore";
import { omit } from "lodash";
import { nanoid } from "nanoid";

@model("Game")
export class Game extends Model({
  gameId: prop(nanoid(), { setterAction: true }),
  name: prop("Untitled", { setterAction: true }),
  imageUrl: prop("", { setterAction: true }),
  dateCreated: prop(Date.now(), { setterAction: true }),
  dateModified: prop(Date.now(), { setterAction: true }),
  recommendedPlayers: prop<[number, number]>(() => [1, 8], {
    setterAction: true
  })
}) {}

@model("GameLibrary")
export default class GameLibrary extends Model({
  library: prop<Game[]>(() => [], { setterAction: true }),
  inProgressGames: prop<Game[]>(() => [], {
    setterAction: true
  })
}) {
  @observable isInitialised = false;

  @modelFlow
  init = _async(function*(this: GameLibrary) {
    yield* _await(persist(this, "gameLibrary"));

    this.loadGames();

    this.isInitialised = true;
  });

  @computed get gameStore() {
    return getRootStore<RootStore>(this)?.gameStore!;
  }

  @computed get inProgressGamesOrderedByDate() {
    const sortedGames = [...this.inProgressGames];
    sortedGames.sort((a, b) => b.dateModified - a.dateModified);
    return sortedGames;
  }

  async loadGames() {
    let gameJsons;
    if (process.env.NODE_ENV === "development") {
      gameJsons = [require("../testGames/Azulito/game.json")];
    } else {
      gameJsons = await Promise.all(
        gameList.map(
          gameUrl => loadJson(gameUrl) as Promise<SnapshotOutOfModel<GameState>>
        )
      );
    }
    gameJsons.forEach(gameJson => {
      this.addGameFromJson(gameJson);
    });
  }

  @modelAction
  addInProgressGame(game: Game) {
    this.inProgressGames.push(game);
  }

  async saveInProgressGame(
    gameId: string,
    gameState: SnapshotOutOf<GameState>
  ) {
    await localforage.setItem(`inprogress-${gameId}`, gameState);
  }

  async newGame(game?: Game) {
    let gameStateSnapshot;
    if (game) {
      game = clone(game);
      gameStateSnapshot = await localforage.getItem<SnapshotOutOf<GameState>>(
        `library-${game.gameId}`
      );
    } else {
      game = new Game({});
      gameStateSnapshot = getSnapshot(new GameState({}));
    }

    gameStateSnapshot = {
      ...gameStateSnapshot,
      players: [],
      views: [],
      setups: gameStateSnapshot.setups ? gameStateSnapshot.setups : []
    };

    this.addInProgressGame(game);
    this.gameStore.playGame(game, gameStateSnapshot);
  }

  async resumeGame(game: Game) {
    if (this.gameStore.currentGameId !== game.$modelId) {
      const gameStateSnapshot = await localforage.getItem<
        SnapshotOutOf<GameState>
      >(`inprogress-${game.$modelId}`);
      this.gameStore.playGame(game, gameStateSnapshot);
    }
  }

  @modelAction
  stopGame(game: Game) {
    this.inProgressGames.splice(this.inProgressGames.indexOf(game), 1);
    localforage.removeItem(`inprogress-${game.$modelId}`);
  }

  @modelAction
  addGameToLibrary(game: Game) {
    this.library.push(clone(game));
  }

  async addGameToLibraryFromInProgress(game: Game) {
    const gameState = await localforage.getItem<SnapshotOutOf<GameState>>(
      `inprogress-${game.$modelId}`
    );
    await localforage.setItem(`library-${game.gameId}`, gameState);

    this.addGameToLibrary(game);
  }

  @modelAction
  addGameFromJson(gameState: SnapshotOutOfModel<GameState>) {
    localforage.setItem(`library-${gameState.gameId}`, gameState);

    const existingGame = this.library.find(game => game.gameId === game.gameId);
    if (existingGame) this.removeGameFromLibrary(existingGame);

    const game = new Game(
      pick(gameState, [
        "gameId",
        "name",
        "imageUrl",
        "dateCreated",
        "dateModified",
        "recommendedPlayers"
      ])
    );

    this.addGameToLibrary(game);
  }

  @modelAction
  removeGameFromLibrary(game: Game) {
    this.library.splice(this.library.indexOf(game), 1);
    localforage.removeItem(`library-${game.gameId}`);
  }

  @modelAction
  updateGameFromState(
    gameId: string,
    gameState: SnapshotOutOfModel<GameState>
  ) {
    const game = this.inProgressGames.find(game => game.$modelId === gameId)!;
    game.name = gameState.name;
    game.imageUrl = gameState.imageUrl;
    game.dateModified = gameState.dateModified;
    game.recommendedPlayers = gameState.recommendedPlayers;
  }

  @modelFlow
  loadGameFromUrl = _async(function*(this: GameLibrary, url: string) {
    const response = yield* _await(
      fetch(`${serverRoot}:9001/${url}`, {
        mode: "cors"
      })
    );
    const gameJson = yield* _await(response.json());

    this.addGameFromJson(gameJson);
  });

  async loadGameByName(name: string) {
    await this.loadGameFromUrl(gameRepoUrl + "/" + name);
  }

  async exportGame(game: Game) {
    const gameSnapshot = await localforage.getItem<SnapshotOutOf<GameState>>(
      `library-${game.gameId}`
    );

    const cleanedJson = omit(gameSnapshot, ["players", "chatHistory"]);

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
