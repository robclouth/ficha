import { computed } from "mobx";
import {
  fromSnapshot,
  getSnapshot,
  Model,
  model,
  modelAction,
  prop,
  Ref,
  applySnapshot,
  clone,
  getRootStore,
  SnapshotOutOfModel,
  rootRef,
  detach
} from "mobx-keystone";
import Entity from "./game/Entity";
import GameSetup, { gameSetupRef } from "./GameSetup";
import Player from "./Player";
import { Vector3 } from "../types";
import RootStore from "../stores/RootStore";
import { Vector3 as ThreeVector3 } from "three";
import { nanoid } from "nanoid";

export type View = {
  name: string;
  position: Vector3;
  target: Vector3;
  zoom: number;
  orthographic: boolean;
};

export const gameStateRef = rootRef<GameState>("gameStateRef", {
  onResolvedValueChange(ref, newGameState, oldGameState) {
    if (oldGameState && !newGameState) detach(ref);
  }
});

@model("GameState")
export default class GameState extends Model({
  gameId: prop(nanoid(), { setterAction: true }),
  name: prop("Untitled", { setterAction: true }),
  author: prop("", { setterAction: true }),
  description: prop("", { setterAction: true }),
  imageUrl: prop("", { setterAction: true }),
  recommendedPlayers: prop<[number, number]>(() => [1, 8], {
    setterAction: true
  }),
  dateCreated: prop(Date.now(), { setterAction: true }),
  dateModified: prop(Date.now(), { setterAction: true }),
  locked: prop(false, { setterAction: true }),
  assetsUrl: prop("", { setterAction: true }),
  players: prop<Player[]>(() => [], { setterAction: true }),
  chatHistory: prop<string[]>(() => [], { setterAction: true }),
  entities: prop<Entity[]>(() => [], { setterAction: true }),
  rules: prop<string[]>(
    () => [
      "Write the rules of the game here using [Markdown](https://www.markdownguide.org/basic-syntax/)"
    ],
    {
      setterAction: true
    }
  ),
  setups: prop<GameSetup[]>(() => [], { setterAction: true }),
  activeSetup: prop<Ref<GameSetup> | undefined>(undefined, {
    setterAction: true
  }),
  views: prop<View[]>(() => [], {
    setterAction: true
  })
}) {
  @computed get uiState() {
    return getRootStore<RootStore>(this)?.uiState;
  }

  @computed get connectedPlayers() {
    return this.players.filter(p => p.isConnected);
  }

  @computed get allSnapPoints() {
    const snapPoints = [];
    for (const entity of this.entities) {
      if (!entity.snapPointsWorld) continue;

      for (const snapPoint of entity.snapPointsWorld) {
        snapPoints.push({
          snapPoint,
          entity
        });
      }
    }
    return snapPoints;
  }

  @modelAction
  addPlayer(player: Player) {
    this.players.push(player);
  }

  @modelAction
  removePlayer(player: Player) {
    this.players.splice(this.players.indexOf(player), 1);
  }

  @modelAction
  addMessage(message: string) {
    this.chatHistory.push(message);
  }

  @modelAction
  addEntity(entity: Entity) {
    this.entities.push(entity);
  }

  @modelAction
  removeEntity(entity: Entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
  }

  @modelAction
  removeAllEntities() {
    this.entities = [];
  }

  @modelAction
  addSetup(gameSetup: GameSetup) {
    gameSetup.entities = clone(this.entities);
    this.setups.push(gameSetup);
  }

  @modelAction
  removeSetup(setup: GameSetup) {
    this.setups.splice(this.setups.indexOf(setup), 1);
  }

  @modelAction
  activateSetup(setup: GameSetup) {
    this.entities = clone(setup.entities);
    this.activeSetup = gameSetupRef(setup);
  }

  @modelAction
  addView() {
    if (this.uiState) {
      const cameraControls = this.uiState.cameraControls;
      const controls = cameraControls as any;
      this.views.push({
        name: "",
        position: {
          x: controls._camera.position.x,
          y: controls._camera.position.y,
          z: controls._camera.position.z
        },
        target: {
          x: controls._target.x,
          y: controls._target.y,
          z: controls._target.z
        },
        zoom: (cameraControls as any)._zoom,
        orthographic: controls._camera.isOrthographicCamera
      });
    }
  }

  @modelAction
  removeView(view: View) {
    this.views.splice(this.views.indexOf(view), 1);
  }

  @modelAction
  setFromJson(gameJson: SnapshotOutOfModel<GameState>) {
    applySnapshot(this, { ...gameJson, $modelId: this.$modelId } as any);
  }

  @modelAction
  toggleLock() {
    this.locked = !this.locked;
  }
}
