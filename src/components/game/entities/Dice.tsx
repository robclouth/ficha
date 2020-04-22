import { observer } from "mobx-react";
import React, { useMemo } from "react";
import {
  BufferGeometry,
  Color,
  OctahedronBufferGeometry,
  OctahedronGeometry,
  Texture,
  Quaternion
} from "three";
import Dice, { DiceType } from "../../../models/game/Dice";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import Entity, { EntityProps } from "./Entity";
import { $enum } from "ts-enum-util";
import {
  DiceD4,
  DiceD6,
  DiceD8,
  DiceD10,
  DiceD12,
  DiceD20,
  DiceObject
} from "./DiceHelper";

export type DiceProps = Omit<EntityProps, "geometry"> & {};
const size = 0.1;

export default observer((props: DiceProps) => {
  const { assetCache } = useStore();
  const { entity } = props;
  const dice = entity as Dice;
  const { ownerSet, color, diceType, value } = dice;

  const contextMenuItems: ContextMenuItem[] = [];

  if (ownerSet) {
    contextMenuItems.push({
      label: "Return to set",
      type: "action",
      action: () => entity.returnToSet()
    });
    contextMenuItems.push({
      label: "Remove from set",
      type: "action",
      action: () => entity.removeFromSet()
    });
  }

  contextMenuItems.push({
    label: "Roll",
    type: "action",
    action: () => dice.roll()
  });

  const materialParams = {
    roughness: 1,
    color: new Color(color.r, color.g, color.b)
  };

  const numSides = $enum.mapValue(diceType).with<number>({
    [DiceType.Coin]: 2,
    [DiceType.D4]: 4,
    [DiceType.D6]: 6,
    [DiceType.D8]: 8,
    [DiceType.D10]: 10,
    [DiceType.D12]: 12,
    [DiceType.D20]: 20
  });

  const diceData = useMemo(() => {
    let die: DiceObject;
    let pivot: [number, number, number] = [0, -0.05, 0];
    if (diceType === DiceType.D4) {
      die = new DiceD4({});
      pivot = [0, -0.04, 0];
    } else if (diceType === DiceType.D6) die = new DiceD6({});
    else if (diceType === DiceType.D8) die = new DiceD8({});
    else if (diceType === DiceType.D10) {
      die = new DiceD10({});
      pivot = [0, -0.061, 0];
    } else if (diceType === DiceType.D12) {
      die = new DiceD12({});
      pivot = [0, -0.072, 0];
    } else {
      die = new DiceD20({});
      pivot = [0, -0.08, 0];
    }

    return {
      geometry: die.geometry,
      textures: die.textures,
      faceRotations: die.faceRotations as Quaternion[],
      pivot
    };
  }, [diceType]);

  return (
    <Entity
      {...props}
      pivot={diceData.pivot}
      geometry={<primitive object={diceData.geometry} attach="geometry" />}
      materialParams={diceData.textures.map((texture: Texture) => ({
        map: texture
      }))}
      contextMenuItems={contextMenuItems}
      rotationOffset={diceData.faceRotations[value]}
      doubleClickAction={() => dice.roll()}
    />
  );
});
