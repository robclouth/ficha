import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Color } from "three";
import HandArea from "../../../models/game/HandArea";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import Entity, { EntityProps } from "./Entity";

export type HandAreaProps = Omit<EntityProps, "geometry"> & {};

let height = 0.01;

export default observer((props: HandAreaProps) => {
  const { t } = useTranslation();
  const { gameStore, assetCache } = useStore();
  const { entity } = props;
  const handArea = entity as HandArea;
  const { player, isHidden, claimed } = handArea;

  const contextMenuItems: ContextMenuItem[] = [];

  if (!claimed)
    contextMenuItems.push({
      label: t("contextMenu.claim"),
      type: "action",
      action: () => handArea.claim(gameStore.thisPlayer)
    });

  contextMenuItems.push({
    label: isHidden
      ? t("contextMenu.revealContents")
      : t("contextMenu.hideContents"),
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
        opacity: 1,
        map: assetCache.getTexture(require("../../../assets/hand-area.png")),
        color: player
          ? new Color(player.color.r, player.color.g, player.color.b)
          : new Color(0.4, 0.4, 0.4)
      }}
      contextMenuItems={contextMenuItems}
      hoverMessage={player?.name || undefined}
      // blockInteraction={claimed && player !== gameStore.thisPlayer}
      castShadows={false}
    />
  );
});
