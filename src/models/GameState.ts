import { observable, action } from "mobx";
import { serializable, list, object, primitive } from "serializr";

import Player from "./Player";

export enum ActionType {
  SendMessage
}

export interface Action {
  type: ActionType;
  data: any;
}

export interface Message extends Action {
  type: ActionType.SendMessage;
  data: string;
}

export default class GameState {
  @serializable(list(object(Player))) @observable players: Player[] = [];
  @serializable(list(primitive())) @observable chatHistory: string[] = [];

  @action addPlayer(player: Player) {
    this.players.push(player);
  }

  @action removePlayer(player: Player) {
    this.players.splice(this.players.indexOf(player), 1);
  }

  @action handleAction(action: Action) {
    if (action.type === ActionType.SendMessage) {
      this.chatHistory.push((action as Message).data);
    }
  }
}
