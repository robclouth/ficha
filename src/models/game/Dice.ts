import { ExtendedModel, model, prop, modelAction } from "mobx-keystone";
import React from "react";
import DiceComponent, { DiceProps } from "../../components/game/entities/Dice";
import Entity, { EntityType } from "./Entity";
import { Box3 } from "three";
import { $enum } from "ts-enum-util";

export enum DiceType {
  Coin,
  D4,
  D6,
  D8,
  // D10,
  D12,
  D20
}

@model("Dice")
export default class Dice extends ExtendedModel(Entity, {
  diceType: prop<DiceType>({ setterAction: true })
}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Dice;

    this.stackable = false;
  }

  @modelAction
  roll() {
    const numSides = $enum.mapValue(this.diceType).with<number>({
      [DiceType.Coin]: 2,
      [DiceType.D4]: 4,
      [DiceType.D6]: 6,
      [DiceType.D8]: 8,
      // [DiceType.D10]: 10,
      [DiceType.D12]: 12,
      [DiceType.D20]: 20
    });

    return Math.floor(Math.random() * numSides);
  }

  render(props: DiceProps): JSX.Element {
    return React.createElement(DiceComponent, props);
  }
}
