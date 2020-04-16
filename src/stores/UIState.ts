import RootStore from "./RootStore";
import { observable, action, computed } from "mobx";
import Entity from "../models/game/Entity";
import { PointerEvent } from "react-three-fiber";

export default class UIState {
  @observable isInitialized = false;
  @observable draggingEntity: Entity | null = null;
  contextMenuEvent?: PointerEvent;

  constructor(private rootStore: RootStore) {}

  async init() {
    this.isInitialized = true;
  }

  @computed get isDraggingEntity() {
    return this.draggingEntity !== null;
  }

  @action setDraggingEntity(entity: Entity | null) {
    this.draggingEntity = entity;
  }
}
