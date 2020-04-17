import { observable, computed } from "mobx";
import {
  Model,
  model,
  modelAction,
  prop,
  findParent,
  getRootPath,
  getRoot,
  getRootStore
} from "mobx-keystone";
import GameState from "../GameState";
import { Box3 } from "three";
import UIState from "../../stores/UIState";
import RootStore from "../../stores/RootStore";

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
  color: prop<[number, number, number]>(() => [1, 1, 1], {
    setterAction: true
  }),
  locked: prop(false, { setterAction: true }),
  faceUp: prop(false, { setterAction: true })
}) {
  @observable boundingBox: Box3 = new Box3();

  @computed get gameState() {
    return findParent<GameState>(
      this,
      parentNode => parentNode instanceof GameState
    )!;
  }

  @computed get uiState() {
    return getRootStore<RootStore>(this)?.uiState;
  }

  @computed get isDragging() {
    return this.uiState?.draggingEntity === this;
  }

  @modelAction
  rotate(radians: number) {
    this.angle += radians;
  }

  @modelAction
  toggleLocked() {
    this.locked = !this.locked;
  }

  @modelAction
  flip() {
    this.faceUp = !this.faceUp;
  }
}
