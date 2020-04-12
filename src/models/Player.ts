import { observable } from "mobx";
import { DataConnection } from "peerjs";
import { serializable } from "serializr";
import { generateId } from "../utils/Utils";

export default class Player {
  @serializable @observable id = "";
  @serializable @observable name = "";
  @serializable @observable wood = 0;

  connection?: DataConnection;

  constructor() {
    this.name = generateId();
  }

  sendGameState(state: any) {
    this.connection && this.connection.send(state);
  }
}
