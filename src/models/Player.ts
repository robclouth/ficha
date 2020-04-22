import { Model, model, prop } from "mobx-keystone";
import { DataConnection } from "peerjs";
import { generateName } from "../utils/NameGenerator";
import { StateData } from "./GameServer";
import { computed } from "mobx";
// @ts-ignore
import randomColor from "random-material-color";
import { Color } from "three";

@model("Player")
export default class Player extends Model({
  userId: prop<string>({ setterAction: true }),
  peerId: prop<string | undefined>(undefined, { setterAction: true }),
  name: prop<string>({ setterAction: true }),
  isConnected: prop(true, { setterAction: true })
}) {
  connection?: DataConnection;

  @computed get color() {
    const c = randomColor.getColor({ text: this.userId });
    return new Color(c);
  }

  sendState(stateData: StateData) {
    this.connection && this.connection.send(stateData);
  }
}
