import RootStore from "./RootStore";
import { observable, action, computed } from "mobx";
import Entity from "../models/game/Entity";
import { PointerEvent } from "react-three-fiber";
import { Vector3, Plane } from "three";

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

export default class UIState {
  @observable isInitialized = false;
  @observable draggingEntity?: Entity;
  @observable contextMenu?: ContextMenu;
  @observable isContextMenuOpen = false;

  constructor(private rootStore: RootStore) {}

  async init() {
    this.isInitialized = true;
  }

  @computed get isDraggingEntity() {
    return this.draggingEntity !== undefined;
  }

  @action setDraggingEntity(entity?: Entity) {
    this.draggingEntity = entity;
  }

  @action openContextMenu(
    e: PointerEvent,
    items?: ContextMenuItem[],
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

  @action closeContextMenu() {
    this.isContextMenuOpen = false;
  }

  @action handleKeyPress(e: React.KeyboardEvent<HTMLDivElement>) {}
}
