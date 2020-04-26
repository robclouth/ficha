import { easeBounceOut, easeQuadOut, easeLinear } from "d3-ease";
import { observer } from "mobx-react";
import React, { useMemo, useState } from "react";
import { useSpring } from "react-spring/three";
import { Color, Quaternion, Texture, FlatShading } from "three";
import Dice, { DiceType } from "../../../models/game/Dice";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";

import Entity, { EntityProps } from "./Entity";
import HandArea from "../../../models/game/HandArea";

export type HandAreaProps = Omit<EntityProps, "geometry"> & {};

let height = 0.01;

export default observer((props: HandAreaProps) => {
  const { gameStore } = useStore();
  const { entity } = props;
  const handArea = entity as HandArea;
  const { player, isHidden, claimed } = handArea;

  const contextMenuItems: ContextMenuItem[] = [];

  if (!claimed)
    contextMenuItems.push({
      label: "Claim",
      type: "action",
      action: () => handArea.claim(gameStore.thisPlayer)
    });

  contextMenuItems.push({
    label: isHidden ? "Reveal contents" : "Hide contents",
    type: "action",
    action: () => handArea.toggleHidden()
  });

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={<boxBufferGeometry args={[6, height, 4]} attach="geometry" />}
      materialParams={{
        roughness: 1,
        opacity: 0.3,
        color: player
          ? new Color(player.color.r, player.color.g, player.color.b)
          : new Color(0.4, 0.4, 0.4)
      }}
      contextMenuItems={contextMenuItems}
      hoverMessage={player?.name || undefined}
      blockInteraction={claimed && player !== gameStore.thisPlayer}
      castShadows={false}
    />
  );
});
