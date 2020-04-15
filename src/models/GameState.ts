import { observable, action } from "mobx";
import { serializable, list, object, primitive } from "serializr";
import { Model, model, modelAction, prop } from "mobx-keystone";

import Player from "./Player";
import Entity from "./game/Entity";
import Card from "./game/Card";

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
  addEntity() {
    const newEntity = new Card({});
    this.entities.push(newEntity);
  }
}
