import RootStore from "./RootStore";
import { observable, action, computed, runInAction } from "mobx";
import Entity from "../models/game/Entity";
import { PointerEvent } from "react-three-fiber";
import { Vector3, Plane, Vector, Vector2, Camera, Matrix4, Euler } from "three";
import {
  model,
  Model,
  prop,
  modelAction,
  modelFlow,
  _async,
  _await,
  getRootStore
} from "mobx-keystone";

import {
  withoutUndo,
  UndoManager,
  undoMiddleware
} from "../utils/undoMiddleware";
import GameState, { View } from "../models/GameState";
import { OptionsObject } from "notistack";
import CameraControls from "camera-controls";
import i18n from "../i18n";

export type ContextMenuItem = {
  label?: string;
  type: "action" | "divider" | "edit";
  target?: Entity;
  action?: () => void;
};

export enum Modals {
  EditEntity,
  EntityLibrary,
  AboutGame,
  ImportGame,
  JoinGame,
  Rules,
  EditSetup,
  GameLibrary,
  Help
}

export type ContextMenu = {
  positionScreen: [number, number];
  positionGroundPlane: [number, number];
  items?: Array<ContextMenuItem | false>;
  target?: Entity;
};

export type Message = {
  text: string;
  options?: OptionsObject;
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
  @observable selectionTopLeft?: [number, number];
  @observable selectionBottomRight?: [number, number];
  selectionStartPoint: [number, number] = [0, 0];
  @observable dragGroupOffsets: { [key: string]: [number, number] } = {};
  @observable allContextMenuItems: {
    [key: string]: Array<ContextMenuItem>;
  } = {};
  @observable snackbarMessage?: Message;
  @observable cameraControls!: CameraControls;
  @observable activeView?: View | "hand";
  undoManager?: UndoManager;

  @observable openModal?: Modals | undefined;

  @computed get gameStore() {
    return getRootStore<RootStore>(this)?.gameStore;
  }

  @computed get canMoveCamera() {
    return !this.isDraggingEntity && !this.isStartingDrag;
  }

  @modelAction
  setLanguage(language: string) {
    i18n.changeLanguage(language);
    localStorage.setItem("i18nextLng", language);
  }

  @modelAction
  selectEntity(entity: Entity) {
    if (entity && !entity.locked)
      this.selectedEntities[entity.$modelId] = entity;
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
      this.undoManager?.startGroup();
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

      this.undoManager?.endGroup();
    }
  }

  // @modelAction
  dragEntity(x: number, z: number) {
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
  }

  @modelAction
  handleSelectionBoxStart(e: React.MouseEvent) {
    this.selectionTopLeft = this.selectionBottomRight = [e.clientX, e.clientY];

    this.selectionStartPoint = [e.clientX, e.clientY];
  }

  @modelAction
  handleSelectionBoxMove(e: React.MouseEvent) {
    if (this.selectionTopLeft && this.selectionBottomRight) {
      this.selectionBottomRight[0] = Math.max(
        this.selectionStartPoint[0],
        e.clientX
      );
      this.selectionBottomRight[1] = Math.max(
        this.selectionStartPoint[1],
        e.clientY
      );
      this.selectionTopLeft[0] = Math.min(
        this.selectionStartPoint[0],
        e.clientX
      );
      this.selectionTopLeft[1] = Math.min(
        this.selectionStartPoint[1],
        e.clientY
      );
    }
  }

  @modelAction
  handleSelectionBoxEnd(e: React.MouseEvent) {
    this.selectionTopLeft = this.selectionBottomRight = undefined;
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
    this.undoManager?.undoGroup(() => {
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

  undo() {
    if (this.canUndo) {
      this.undoManager?.undo();
    }
  }

  redo() {
    if (this.canRedo) this.undoManager?.redo();
  }

  @computed get canUndo() {
    return this.undoManager?.canUndo;
  }

  @computed get canRedo() {
    return this.undoManager?.canRedo;
  }

  showMessage(message: Message) {
    this.snackbarMessage = message;
  }

  setupUndoManager(gameState: GameState) {
    this.undoManager = undoMiddleware(gameState, ["players"]);
  }

  @modelAction
  activateView(view: View | "hand") {
    this.activeView = view;

    if (view === "hand") {
      const handArea = this.gameStore?.thisPlayer.handArea;
      const boundingBox = handArea?.boundingBox;
      if (boundingBox) {
        this.cameraControls.rotateTo(handArea!.angle, -Math.PI / 2, false);
        this.cameraControls.moveTo(
          handArea!.position.x,
          handArea!.position.z,
          5,
          false
        );
        this.cameraControls.fitTo(boundingBox, false);
      }
    } else {
      const { position, target, zoom, orthographic } = view;
      this.cameraControls.setPosition(position.x, position.y, position.z);
      this.cameraControls.setTarget(target.x, target.y, target.z);
    }
  }

  @modelAction
  setOpenModal(modal?: Modals) {
    this.openModal = modal;
  }

  @modelAction
  handleKeyPress(e: KeyboardEvent) {
    switch (e.key) {
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        const viewIndex = parseInt(e.key) - 1;
        let startIndex = 0;
        if (this.gameStore?.thisPlayer.handArea) {
          startIndex = 1;
          if (viewIndex === 0) {
            this.activateView("hand");
            break;
          }
        }

        const view = this.gameStore?.gameState.views[viewIndex - startIndex];
        view && this.activateView(view);
        break;
    }
  }
}
