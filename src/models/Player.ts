import { Model, model, modelAction, prop } from "mobx-keystone";
import { DataConnection } from "peerjs";
import { generateId } from "../utils/Utils";
import { StateData } from "./GameServer";

@model("Player")
export default class Player extends Model({
  id: prop<string>({ setterAction: true }),
  peerId: prop<string>({ setterAction: true }),
  name: prop(() => generateId(), { setterAction: true })
}) {
  connection?: DataConnection;

  sendState(stateData: StateData) {
    this.connection && this.connection.send(stateData);
  }
}
