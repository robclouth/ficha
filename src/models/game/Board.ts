import { ExtendedModel, model, prop } from "mobx-keystone";
import React from "react";
import BoardComponent, {
  BoardProps
} from "../../components/game/entities/Board";
import Entity, { EntityType } from "./Entity";

@model("Board")
export default class Board extends ExtendedModel(Entity, {}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Board;
    this.stackable = false;
  }

  render(props: BoardProps): JSX.Element {
    return React.createElement(BoardComponent, props);
  }
}
