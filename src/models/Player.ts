import { Model, model, prop, getParent, findParent } from "mobx-keystone";
import { DataConnection } from "peerjs";
import { generateName } from "../utils/NameGenerator";
import { StateData } from "./GameServer";
import { computed } from "mobx";
// @ts-ignore
import randomColor from "random-material-color";
import { Color } from "three";
import GameState from "./GameState";
import { EntityType } from "./game/Entity";
import HandArea from "./game/HandArea";

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

  @computed get handArea() {
    const gameState = findParent<GameState>(
      this,
      parentNode => parentNode instanceof GameState
    );

    if (!gameState) return undefined;

    return gameState.entities.find(
      entity =>
        entity.type === EntityType.HandArea &&
        (entity as HandArea).playerId === this.userId
    );
  }

  sendState(stateData: StateData) {
    this.connection && this.connection.send(stateData);
  }
}
