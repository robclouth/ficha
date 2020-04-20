import localforage from "localforage";
import { reaction, observable } from "mobx";
import {
  getSnapshot,
  model,
  Model,
  modelAction,
  prop,
  modelFlow,
  _async,
  _await,
  SnapshotOutOf,
  fromSnapshot,
  undoMiddleware,
  applySnapshot,
  clone
} from "mobx-keystone";
import Entity from "../models/game/Entity";
import GameStore from "./GameStore";
import { nanoid } from "nanoid";
import { generateName } from "../utils/NameGenerator";
import GameState from "../models/GameState";
import Player from "../models/Player";
import Deck from "../models/game/Deck";
import { Card } from "@material-ui/core";

@model("EntityLibrary")
export default class EntityLibrary extends Model({
  entities: prop<Entity[]>(() => [], { setterAction: true })
}) {
  @observable isInitialised = false;

  @modelFlow
  init = _async(function*(this: GameStore) {
    const snapshot = yield* _await(
      localforage.getItem<SnapshotOutOf<GameStore>>("entityLibrary")
    );

    if (snapshot) applySnapshot(this, { ...snapshot, $modelId: this.$modelId });

    reaction(
      () => getSnapshot(this),
      snapshot => {
        localforage.setItem("entityLibrary", snapshot);
      },
      { delay: 1000 }
    );

    this.isInitialised = true;
  });

  @modelAction
  addEntity(entity: Entity) {
    this.entities.push(clone(entity));
  }

  @modelAction
  removeEntity(entity: Entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
  }
}
