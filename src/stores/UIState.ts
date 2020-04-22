import RootStore from "./RootStore";
import { observable, action, computed } from "mobx";
import Entity from "../models/game/Entity";
import { PointerEvent } from "react-three-fiber";
import { Vector3, Plane, Vector, Vector2 } from "three";
import {
  model,
  Model,
  prop,
  modelAction,
  modelFlow,
  _async,
  _await,
  getRootStore,
  withoutUndo
} from "mobx-keystone";

export type ContextMenuItem = {
  label?: string;
  type: "action" | "divider" | "edit";
  target?: Entity;
  action?: () => void;
};

export type ContextMenu = {
  positionScreen: [number, number];
  positionGroundPlane: [number, number];
  items?: Array<ContextMenuItem | false>;
  target?: Entity;
};

@model("UIState")
export default class UIState extends Model({}) {
  @observable draggingEntity?: Entity;
  @observable hoveredEntity?: Entity;

  @observable isDraggingEntity = false;
  @observable isStartingDrag = false;
  @observable contextMenu?: ContextMenu;
  @observable isContextMenuOpen = false;
  @observable selectedEntities: { [id: string]: Entity } = {};
  @observable selectionBoxStart?: [number, number];
  @observable selectionBoxEnd?: [number, number];
  @observable dragGroupOffsets: { [key: string]: [number, number] } = {};
  @observable allContextMenuItems: {
    [key: string]: Array<ContextMenuItem>;
  } = {};

  @computed get gameStore() {
    return getRootStore<RootStore>(this)?.gameStore;
  }

  @computed get canMoveCamera() {
    return !this.isDraggingEntity && !this.isStartingDrag;
  }

  @modelAction
  selectEntity(entity: Entity) {
    if (entity) this.selectedEntities[entity.$modelId] = entity;
  }

  @modelAction
  deselectEntity(entity: Entity) {
    delete this.selectedEntities[entity.$modelId];
  }

  @modelAction
  setHoveredEntity(entity?: Entity) {
    this.hoveredEntity = entity;
  }

  @modelAction
  deselectAll() {
    this.selectedEntities = {};
  }

  @modelAction
  setDraggingEntity(entity?: Entity) {
    if (entity) {
      this.isDraggingEntity = true;
      entity.controllingPeerId = this.gameStore?.peerId;
      this.draggingEntity = entity;

      this.dragGroupOffsets = {};

      Object.values(this.selectedEntities).forEach(entity => {
        if (entity !== this.draggingEntity) {
          this.dragGroupOffsets[entity.$modelId] = [
            this.draggingEntity!.position.x - entity.position.x,
            this.draggingEntity!.position.z - entity.position.z
          ];
        }
      });
    } else {
      this.isDraggingEntity = false;
      if (this.draggingEntity) {
        this.draggingEntity.controllingPeerId = undefined;
      }
    }
  }

  // @modelAction
  dragEntity(x: number, z: number) {
    withoutUndo(() => {
      this.draggingEntity!.setPosition(x, z);

      if (!this.draggingEntity) return;
      Object.values(this.selectedEntities).forEach(entity => {
        if (entity !== this.draggingEntity) {
          const offset = this.dragGroupOffsets[entity.$modelId];

          entity.setPosition(
            this.draggingEntity!.position.x - offset[0],
            this.draggingEntity!.position.z - offset[1],
            Object.values(this.selectedEntities)
          );
        }
      });
    });
  }

  @modelAction
  handleSelectionBoxStart(e: React.MouseEvent) {
    this.selectionBoxStart = this.selectionBoxEnd = [e.clientX, e.clientY];
  }

  @modelAction
  handleSelectionBoxMove(e: React.MouseEvent) {
    if (this.selectionBoxStart && this.selectionBoxEnd) {
      if (e.clientX <= this.selectionBoxStart[0])
        this.selectionBoxStart[0] = e.clientX;
      else this.selectionBoxEnd[0] = e.clientX;

      if (e.clientY <= this.selectionBoxStart[1])
        this.selectionBoxStart[1] = e.clientY;
      else this.selectionBoxEnd[1] = e.clientY;
    }
  }

  @modelAction
  handleSelectionBoxEnd(e: React.MouseEvent) {
    this.selectionBoxStart = this.selectionBoxEnd = undefined;
  }

  @modelAction
  openContextMenu(
    e: PointerEvent,
    items?: Array<ContextMenuItem>,
    target?: Entity
  ) {
    let point = new Vector3();
    e.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), point);
    const positionGroundPlane: [number, number] = [point.x, point.z];

    this.contextMenu = {
      positionScreen: [e.clientX, e.clientY],
      positionGroundPlane,
      items,
      target
    };

    this.isContextMenuOpen = true;
  }

  doContextMenuAction(item: ContextMenuItem) {
    item.action && item.action();

    Object.values(this.selectedEntities).forEach(entity => {
      if (
        entity !== item.target &&
        entity.$modelType === item.target?.$modelType
      ) {
        const items = this.allContextMenuItems[entity.$modelId];
        const matchedItem = items.find(i => i.label === item.label);
        if (matchedItem?.action) matchedItem.action();
      }
    });
  }

  registerContextMenuItems(entity: Entity, items: Array<ContextMenuItem>) {
    this.allContextMenuItems[entity.$modelId] = items.filter(
      item => item
    ) as ContextMenuItem[];
  }

  @modelAction
  closeContextMenu() {
    this.isContextMenuOpen = false;
  }

  @modelAction
  handleKeyPress(e: React.KeyboardEvent<HTMLDivElement>) {}
}
