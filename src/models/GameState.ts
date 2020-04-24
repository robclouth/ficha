import { computed } from "mobx";
import {
  fromSnapshot,
  getSnapshot,
  Model,
  model,
  modelAction,
  prop,
  Ref,
  applySnapshot,
  clone
} from "mobx-keystone";
import Entity from "./game/Entity";
import GameSetup, { gameSetupRef } from "./GameSetup";
import Player from "./Player";

@model("GameState")
export default class GameState extends Model({
  name: prop("", { setterAction: true }),
  assetsUrl: prop("", { setterAction: true }),
  hostPeerId: prop("", { setterAction: true }),
  players: prop<Player[]>(() => [], { setterAction: true }),
  chatHistory: prop<string[]>(() => [], { setterAction: true }),
  entities: prop<Entity[]>(() => [], { setterAction: true }),
  rules: prop<string[]>(() => [], {
    setterAction: true
  }),
  setups: prop<GameSetup[]>(() => [], { setterAction: true }),
  activeSetup: prop<Ref<GameSetup> | undefined>(undefined, {
    setterAction: true
  })
}) {
  @computed get connectedPlayers() {
    return this.players.filter(p => p.isConnected);
  }

  @modelAction
  addPlayer(player: Player) {
    this.players.push(player);
  }

  @modelAction
  removePlayer(player: Player) {
    this.players.splice(this.players.indexOf(player), 1);
  }

  @modelAction
  addMessage(message: string) {
    this.chatHistory.push(message);
  }

  @modelAction
  addEntity(entity: Entity) {
    this.entities.push(entity);
  }

  @modelAction
  removeEntity(entity: Entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
  }

  @modelAction
  removeAllEntities() {
    this.entities = [];
  }

  @modelAction
  addSetup(gameSetup: GameSetup) {
    gameSetup.entities = clone(this.entities);
    this.setups.push(gameSetup);
  }

  @modelAction
  removeSetup(setup: GameSetup) {
    this.setups.splice(this.setups.indexOf(setup), 1);
  }

  @modelAction
  activateSetup(setup: GameSetup) {
    this.entities = clone(setup.entities);
    this.activeSetup = gameSetupRef(setup);
  }
}
