import { easeBounceOut, easeQuadOut, easeLinear } from "d3-ease";
import { observer } from "mobx-react";
import React, { useMemo, useState } from "react";
import { useSpring } from "react-spring/three";
import { Color, Quaternion, Texture, FlatShading } from "three";
import Dice, { DiceType } from "../../../models/game/Dice";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import delay from "delay";
import {
  DiceD10,
  DiceD12,
  DiceD20,
  DiceD4,
  DiceD6,
  DiceD8,
  DiceObject
} from "./DiceHelper";
import Entity, { EntityProps } from "./Entity";

export type DiceProps = Omit<EntityProps, "geometry"> & {};
const size = 0.1;

enum RollPhase {
  None,
  Rising,
  Falling
}

export default observer((props: DiceProps) => {
  const { assetCache } = useStore();
  const { entity } = props;
  const dice = entity as Dice;
  const { ownerSet, color, diceType, value, labels } = dice;
  const [rollPhase, setRollPhase] = useState(RollPhase.None);

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
    action: () => handleRoll()
  });

  const handleRoll = async () => {
    setRollPhase(RollPhase.Rising);
    await delay(250);
    setRollPhase(RollPhase.Falling);
    await delay(750);
    dice.roll();
    setRollPhase(RollPhase.None);
  };

  const diceData = useMemo(() => {
    let die: DiceObject;
    let pivot: [number, number, number] = [0, -0.05, 0];
    if (diceType === DiceType.D4) {
      die = new DiceD4({ labels });
      pivot = [0, -0.04, 0];
    } else if (diceType === DiceType.D6) die = new DiceD6({ labels });
    else if (diceType === DiceType.D8) die = new DiceD8({ labels });
    else if (diceType === DiceType.D10) {
      die = new DiceD10({ labels });
      pivot = [0, -0.061, 0];
    } else if (diceType === DiceType.D12) {
      die = new DiceD12({ labels });
      pivot = [0, -0.072, 0];
    } else {
      die = new DiceD20({ labels });
      pivot = [0, -0.08, 0];
    }

    return {
      geometry: die.geometry,
      textures: die.textures,
      faceRotations: die.faceRotations as Quaternion[],
      pivot
    };
  }, [diceType, ...labels]);

  const animation = useSpring({
    to: {
      position: [0, rollPhase === RollPhase.Rising ? 1.5 : 0, 0] as any
    },
    config:
      rollPhase === RollPhase.Rising
        ? { duration: 250, easing: easeQuadOut }
        : { duration: 750, easing: easeBounceOut }
  });

  return (
    <Entity
      {...props}
      pivot={diceData.pivot}
      geometry={<primitive object={diceData.geometry} attach="geometry" />}
      materialParams={diceData.textures.map((texture: Texture) => ({
        map: texture,
        roughness: 0.1,
        flatShading: true,
        color: new Color(color.r, color.g, color.b)
      }))}
      contextMenuItems={contextMenuItems}
      rotationOffset={diceData.faceRotations[value]}
      positionOffset={animation.position}
      doubleClickAction={handleRoll}
      hoverMessage={labels[value]}
    />
  );
});
