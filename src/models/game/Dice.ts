import { ExtendedModel, model, prop, modelAction } from "mobx-keystone";
import React from "react";
import DiceComponent, { DiceProps } from "../../components/game/entities/Dice";
import Entity, { EntityType } from "./Entity";
import { Box3 } from "three";
import { $enum } from "ts-enum-util";
import delay from "delay";

export enum DiceType {
  Coin,
  D4,
  D6,
  D8,
  D10,
  D12,
  D20
}

@model("Dice")
export default class Dice extends ExtendedModel(Entity, {
  diceType: prop<DiceType>({ setterAction: true }),
  rolling: prop(false, { setterAction: true }),
  value: prop(0, { setterAction: true }),
  labels: prop<string[]>(
    () => [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20"
    ],
    { setterAction: true }
  )
}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Dice;
  }

  async roll() {
    const numSides = $enum.mapValue(this.diceType).with<number>({
      [DiceType.Coin]: 2,
      [DiceType.D4]: 4,
      [DiceType.D6]: 6,
      [DiceType.D8]: 8,
      [DiceType.D10]: 10,
      [DiceType.D12]: 12,
      [DiceType.D20]: 20
    });

    this.rolling = true;
    await delay(1000);
    this.value = Math.floor(Math.random() * numSides);
    this.rolling = false;
  }

  render(props: DiceProps): JSX.Element {
    return React.createElement(DiceComponent, props);
  }
}
