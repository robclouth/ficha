import { observable, computed } from "mobx";
import { Model, model, modelAction, prop, findParent } from "mobx-keystone";
import GameState from "../GameState";

export enum EntityType {
  Deck,
  Card
}

@model("Entity")
export default class Entity extends Model({
  name: prop("", { setterAction: true }),
  type: prop<EntityType>(EntityType.Card, { setterAction: true }),
  position: prop<[number, number]>(() => [0, 0], { setterAction: true }),
  angle: prop(0, { setterAction: true }),
  scale: prop(1, { setterAction: true }),
  color: prop<[number, number, number]>(() => [1, 1, 1], { setterAction: true })
}) {
  @computed get gameState() {
    return findParent<GameState>(
      this,
      parentNode => parentNode instanceof GameState
    )!;
  }

  @modelAction
  rotate(radians: number) {
    this.angle += radians;
  }
}
