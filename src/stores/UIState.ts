import RootStore from "./RootStore";
import { observable, action } from "mobx";
import Entity from "../models/game/Entity";

export default class UIState {
  @observable isInitialized = false;
  @observable isDraggingEntity = false;

  constructor(private rootStore: RootStore) {}

  async init() {
    this.isInitialized = true;
    document.addEventListener("mouseup", this.onMouseUp, false);
  }

  @action setDraggingEntity(isDragging: boolean) {
    this.isDraggingEntity = isDragging;
  }

  @action onMouseUp() {
    this.isDraggingEntity = false;
  }
}
