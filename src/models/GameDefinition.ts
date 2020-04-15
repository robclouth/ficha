import { Model, model, tProp, types, prop } from "mobx-keystone";
import { DataConnection } from "peerjs";
import Entity from "./game/Entity";
import { StateData } from "./GameServer";

@model("GameDefinition")
export default class GameDefinition extends Model({
  name: tProp(types.string, "", { setterAction: true }),
  baseUrl: prop<string>({ setterAction: true }),
  entities: tProp(types.array(types.model(Entity)), () => [])
}) {}
