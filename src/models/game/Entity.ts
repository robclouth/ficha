import { observable, computed } from "mobx";
import {
  Model,
  model,
  modelAction,
  prop,
  findParent,
  getRootPath,
  getRoot,
  getRootStore,
  clone
} from "mobx-keystone";
import GameState from "../GameState";
import { Box3 } from "three";
import UIState from "../../stores/UIState";
import RootStore from "../../stores/RootStore";
import { nanoid } from "nanoid";

export enum EntityType {
  Deck,
  Card
}

@model("Entity")
export default class Entity extends Model({
  id: prop(nanoid(), { setterAction: true }),
  name: prop("", { setterAction: true }),
  type: prop<EntityType>(EntityType.Card, { setterAction: true }),
  position: prop<[number, number]>(() => [0, 0], { setterAction: true }),
  angle: prop(0, { setterAction: true }),
  scale: prop(1, { setterAction: true }),
  color: prop<{ r: number; g: number; b: number }>(
    () => ({ r: 1, g: 1, b: 1 }),
    {
      setterAction: true
    }
  ),
  locked: prop(false, { setterAction: true }),
  faceUp: prop(false, { setterAction: true }),
  controllingPeerId: prop<string | undefined>(undefined, { setterAction: true })
}) {
  @observable boundingBox: Box3 = new Box3();

  @computed get gameState() {
    return findParent<GameState>(
      this,
      parentNode => parentNode instanceof GameState
    )!;
  }

  @computed get assetCache() {
    return getRootStore<RootStore>(this)?.assetCache;
  }

  @computed get uiState() {
    return getRootStore<RootStore>(this)?.uiState;
  }

  @computed get gameStore() {
    return getRootStore<RootStore>(this)?.gameStore;
  }

  @computed get isOtherPlayerControlling() {
    if (!this.controllingPeerId) return false;
    return this.controllingPeerId !== this.gameStore?.peer?.id;
  }

  @computed get isDragging() {
    return (
      this.uiState?.isDraggingEntity && this.uiState?.draggingEntity === this
    );
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

  @modelAction
  duplicate() {
    const clonedEntity = clone(this);
    clonedEntity.position[0] += 1;
    this.gameState.addEntity(clonedEntity);
  }
}
