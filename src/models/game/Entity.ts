import { omit } from "lodash";
import { computed, when } from "mobx";
import {
  applySnapshot,
  clone,
  detach,
  findParent,
  getRootStore,
  getSnapshot,
  Model,
  model,
  modelAction,
  OnSnapshotDisposer,
  prop,
  Ref,
  rootRef
} from "mobx-keystone";
import { Box3, Matrix4 } from "three";
import RootStore from "../../stores/RootStore";
import { Vector3 } from "../../types";
import GameState from "../GameState";
import EntitySet from "./EntitySet";

export enum EntityType {
  Deck,
  Card,
  Tile,
  Dice,
  Piece,
  PieceSet,
  Board,
  Any,
  HandArea
}

export const entityRef = rootRef<Entity>("EntityRef", {
  onResolvedValueChange(ref, newEntity, oldEntity) {
    if (oldEntity && !newEntity) detach(ref);
  }
});

@model("Entity")
export default class Entity extends Model({
  name: prop("", { setterAction: true }),
  type: prop<EntityType>(EntityType.Card, { setterAction: true }),
  isPrototype: prop(false, { setterAction: true }),
  ownerSet: prop<Ref<EntitySet> | undefined>(undefined, { setterAction: true }),
  prototype: prop<Ref<Entity> | undefined>(undefined, { setterAction: true }),
  position: prop<Vector3>(() => ({ x: 0, y: 0, z: 0 }), { setterAction: true }),
  angle: prop(0, { setterAction: true }),
  scale: prop<Vector3>(() => ({ x: 1, y: 1, z: 1 }), { setterAction: true }),
  color: prop<{ r: number; g: number; b: number }>(
    () => ({ r: 1, g: 1, b: 1 }),
    {
      setterAction: true
    }
  ),
  locked: prop(false, { setterAction: true }),
  faceUp: prop(true, { setterAction: true }),
  stackable: prop(false, { setterAction: true }),
  editable: prop(true, { setterAction: true }),
  controllingUserId: prop<string | undefined>(undefined, { setterAction: true })
}) {
  onSnapshotDisposer?: OnSnapshotDisposer;

  boundingBox?: Box3;
  handArea?: Entity;
  prevMeshMatrix?: Matrix4;

  onInit() {}

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

  @computed get controllingPlayer() {
    return this.gameState?.players.find(
      p => p.userId == this.controllingUserId
    );
  }

  @computed get isOtherPlayerControlling() {
    return (
      this.controllingPlayer &&
      this.controllingPlayer!.isConnected &&
      this.controllingPlayer !== this.gameStore?.thisPlayer
    );
  }

  @computed get isDragging() {
    return (
      this.uiState?.isDraggingEntity && this.uiState?.draggingEntity === this
    );
  }

  @computed get isSelected() {
    return this.uiState?.selectedEntities[this.$modelId] !== undefined;
  }

  updateBoundingBox(boundingBox: Box3) {
    this.boundingBox = boundingBox;

    this.updateHandArea();
  }

  updateHandArea() {
    this.handArea = undefined;
    if (this.$modelType !== "HandArea" && this.gameState && this.boundingBox) {
      for (const otherEntity of this.gameState.entities) {
        if (
          otherEntity !== this &&
          otherEntity.$modelType === "HandArea" &&
          otherEntity.boundingBox
        ) {
          const collision = this.boundingBox.intersectsBox(
            otherEntity.boundingBox
          );
          if (collision) {
            this.handArea = otherEntity;
            break;
          }
        }
      }
    }
  }

  @modelAction
  setPosition(x: number, z: number, ignoreEntities: Entity[] = []) {
    let y = 0;
    if (this.boundingBox && this.gameState) {
      for (const otherEntity of this.gameState.entities) {
        if (ignoreEntities.includes(otherEntity)) continue;
        if (otherEntity !== this && otherEntity.boundingBox) {
          const collision =
            this.stackable &&
            this.boundingBox.intersectsBox(otherEntity.boundingBox);

          if (collision && otherEntity.boundingBox.max.y > y) {
            y = otherEntity.boundingBox.max.y;
          }
        }
      }
    }

    this.position = { x, y, z };
  }

  @modelAction
  updateFromPrototype() {
    if (!this.prototype?.maybeCurrent) return;

    let snapshot = getSnapshot(this.prototype?.maybeCurrent)!;

    const newSnapshot = omit(snapshot, [
      "$modelId",
      "isPrototype",
      "position",
      "angle",
      "faceUp",
      "ownerSet",
      "prototype",
      "locked",
      "controllingPeerId"
    ]);

    applySnapshot(this, { ...getSnapshot(this), ...newSnapshot });
  }

  @modelAction
  setScaleX(scale: number) {
    this.scale.x = scale;
  }

  @modelAction
  setScaleY(scale: number) {
    this.scale.y = scale;
  }

  @modelAction
  setScaleZ(scale: number) {
    this.scale.z = scale;
  }

  @modelAction
  setScale(scale: number) {
    this.scale.x = this.scale.y = this.scale.z = scale;
  }

  getScale() {
    return this.scale;
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
    clonedEntity.position.x += 1;
    this.gameState.addEntity(clonedEntity);
  }

  @modelAction
  returnToSet() {
    if (this.ownerSet) {
      const set = this.ownerSet.current;
      this.gameState.removeEntity(this);
      set.addEntity(this);
      this.position = { x: 0, y: 0, z: 0 };
      this.faceUp = set.faceUp;
    }
  }

  @modelAction
  removeFromSet() {
    this.ownerSet = undefined;
    this.prototype = undefined;
  }

  render(props: any): JSX.Element | null {
    return null;
  }
}
