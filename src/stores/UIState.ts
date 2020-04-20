import RootStore from "./RootStore";
import { observable, action, computed } from "mobx";
import Entity from "../models/game/Entity";
import { PointerEvent } from "react-three-fiber";
import { Vector3, Plane } from "three";
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
  items?: ContextMenuItem[];
  target?: Entity;
};

@model("UIState")
export default class UIState extends Model({}) {
  @observable draggingEntity?: Entity;
  @observable isDraggingEntity = false;
  @observable isStartingDrag = false;
  @observable contextMenu?: ContextMenu;
  @observable isContextMenuOpen = false;

  @computed get gameStore() {
    return getRootStore<RootStore>(this)?.gameStore;
  }

  @computed get canMoveCamera() {
    return !this.isDraggingEntity && !this.isStartingDrag;
  }

  @modelAction
  setDraggingEntity(entity?: Entity) {
    if (entity) {
      this.isDraggingEntity = true;
      entity.controllingPeerId = this.gameStore?.peerId;
      this.draggingEntity = entity;
    } else {
      this.isDraggingEntity = false;
      if (this.draggingEntity) {
        this.draggingEntity.controllingPeerId = undefined;
      }
    }
  }

  @modelAction
  openContextMenu(e: PointerEvent, items?: ContextMenuItem[], target?: Entity) {
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

  @modelAction
  closeContextMenu() {
    this.isContextMenuOpen = false;
  }

  @modelAction
  handleKeyPress(e: React.KeyboardEvent<HTMLDivElement>) {}
}
