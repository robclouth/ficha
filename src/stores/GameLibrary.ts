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
  getSnapshot
} from "mobx-keystone";
import { gameRepoUrl, serverRoot } from "../constants/constants";
import gameList from "../constants/gameList";
import GameState from "../models/GameState";
import persist from "../utils/persistent";
import { loadJson } from "../utils/Utils";
import GameStore from "./GameStore";
import RootStore from "./RootStore";
import { omit } from "lodash";

@model("GameLibrary")
export default class GameLibrary extends Model({
  library: prop<GameState[]>(() => [], { setterAction: true }),
  inProgressGames: prop<GameState[]>(() => [], { setterAction: true })
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
  newGame(game?: GameState) {
    if (game) {
      game = clone(game);
    } else {
      game = new GameState({});
    }
    this.inProgressGames.push(game);

    this.gameStore.playGame(game);
  }

  @modelAction
  resumeGame(game: GameState) {
    if (this.gameStore.currentGame?.maybeCurrent !== game)
      this.gameStore.playGame(game);
  }

  @modelAction
  stopGame(game: GameState) {
    this.inProgressGames.splice(this.inProgressGames.indexOf(game), 1);
  }

  @modelAction
  addGameToLibrary(game: GameState) {
    const cloned = clone(game);
    cloned.players = [];
    cloned.chatHistory = [];
    this.library.push(cloned);
  }

  @modelAction
  addGameFromJson(gameJson: SnapshotOutOfModel<GameState>) {
    const existingGame = this.library.find(
      game => game.gameId === gameJson.gameId
    );
    if (existingGame) existingGame.setFromJson(gameJson);
    else {
      this.addGameToLibrary(fromSnapshot<GameState>(gameJson));
    }
  }

  @modelAction
  removeGameFromLibrary(game: GameState) {
    this.library.splice(this.library.indexOf(game), 1);
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
}
