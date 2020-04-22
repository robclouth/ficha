import { observer } from "mobx-react";
import React from "react";
import { BufferGeometry, Color } from "three";
import Dice, { DiceType } from "../../../models/game/Dice";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import Entity, { EntityProps } from "./Entity";
import { $enum } from "ts-enum-util";

export type DiceProps = Omit<EntityProps, "geometry"> & {};
const size = 0.1;

export default observer((props: DiceProps) => {
  const { assetCache } = useStore();
  const { entity } = props;
  const dice = entity as Dice;
  const { ownerSet, color, diceType } = dice;

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

  let geometry: React.ReactElement<BufferGeometry>;

  let pivot: [number, number, number] = [0, 0, 0];
  let rotationOffset: [number, number, number] = [0, 0, 0];

  const numSides = $enum.mapValue(diceType).with<number>({
    [DiceType.Coin]: 2,
    [DiceType.D4]: 4,
    [DiceType.D6]: 6,
    [DiceType.D8]: 8,
    // [DiceType.D10]: 10,
    [DiceType.D12]: 12,
    [DiceType.D20]: 20
  });

  if (diceType === DiceType.Coin) {
    geometry = (
      <cylinderBufferGeometry args={[size, size, 0.02, 20]} attach="geometry" />
    );
    pivot[1] = -0.02 * 0.5;
  } else if (diceType === DiceType.D4) {
    geometry = (
      <tetrahedronBufferGeometry
        args={[(size / 2) * 1.3, 0]}
        attach="geometry"
      />
    );
    rotationOffset[1] = Math.PI / 4;
    rotationOffset[0] = Math.acos(1 / Math.sqrt(3));
    pivot[1] = -size * 0.2;
  } else if (diceType === DiceType.D6) {
    geometry = (
      <boxBufferGeometry
        args={[size * 0.7, size * 0.7, size * 0.7]}
        attach="geometry"
      />
    );
    pivot[1] = -size * 0.7 * 0.5;
  } else if (diceType === DiceType.D8) {
    geometry = (
      <octahedronBufferGeometry
        args={[(size / 2) * 1.2, 0]}
        attach="geometry"
      />
    );
    rotationOffset[2] = -0.8;
    rotationOffset[1] = 0.0;
    rotationOffset[0] = Math.PI / 4 - 0.17;
    pivot[1] = -size * 0.35;
  } else if (diceType === DiceType.D12) {
    geometry = (
      <dodecahedronBufferGeometry args={[size / 2, 0]} attach="geometry" />
    );
    rotationOffset[2] = 0;
    rotationOffset[1] = 0.0;
    rotationOffset[0] = (Math.PI - (Math.PI - Math.atan(2))) / 2;
    pivot[1] = -size * 0.4;
  } else if (diceType === DiceType.D20) {
    geometry = (
      <icosahedronBufferGeometry args={[size / 2, 0]} attach="geometry" />
    );
    rotationOffset[2] = 0.0;
    rotationOffset[1] = 0.0;
    rotationOffset[0] = (Math.PI - (Math.PI - Math.acos(Math.sqrt(5) / 3))) / 2;
    pivot[1] = -size * 0.4;
  }

  return (
    <Entity
      {...props}
      pivot={pivot}
      geometry={geometry!}
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      rotationOffset={rotationOffset}
    />
  );
});
