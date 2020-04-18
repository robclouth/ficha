import { computed } from "mobx";
import { Model, model, modelAction, prop } from "mobx-keystone";
import Entity from "./game/Entity";
import Player from "./Player";

@model("GameState")
export default class GameState extends Model({
  name: prop("", { setterAction: true }),
  assetsUrl: prop("", { setterAction: true }),
  hostPeerId: prop("", { setterAction: true }),
  players: prop<Player[]>(() => [], { setterAction: true }),
  chatHistory: prop<string[]>(() => [], { setterAction: true }),
  entities: prop<Entity[]>(() => [], { setterAction: true })
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
  removeAll() {
    this.entities = [];
  }
}
