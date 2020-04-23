import {
  detach,
  Model,
  model,
  prop,
  rootRef,
  SnapshotOutOfModel
} from "mobx-keystone";
import Entity from "./game/Entity";

@model("GameSetup")
export default class GameSetup extends Model({
  name: prop("", { setterAction: true }),
  numPlayers: prop(2, { setterAction: true }),
  entities: prop<Entity[]>(() => [], { setterAction: true })
}) {}

export const gameSetupRef = rootRef<GameSetup>("GameSetupRef", {
  onResolvedValueChange(ref, newSetup, oldSetup) {
    if (oldSetup && !newSetup) detach(ref);
  }
});
