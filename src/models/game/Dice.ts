import { ExtendedModel, model } from "mobx-keystone";
import React from "react";
import PieceComponent, {
  PieceProps
} from "../../components/game/entities/Piece";
import Entity, { EntityType } from "./Entity";

@model("Dice")
export default class Dice extends ExtendedModel(Entity, {}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Dice;

    this.stackable = false;
  }

  render(props: PieceProps): JSX.Element {
    return React.createElement(PieceComponent, props);
  }
}
