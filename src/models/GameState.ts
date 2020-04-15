import { Model, model, modelAction, prop } from "mobx-keystone";
import Entity from "./game/Entity";
import Player from "./Player";
import Card from "./game/Card";
import Deck from "./game/Deck";

@model("GameState")
export default class GameState extends Model({
  players: prop<Player[]>(() => []),
  chatHistory: prop<string[]>(() => []),
  entities: prop<Entity[]>(() => [])
}) {
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
}
