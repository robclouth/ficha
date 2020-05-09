import { observer } from "mobx-react";
import React, { useEffect } from "react";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import Deck from "../../../models/game/Deck";
import { cardHeight } from "./Card";
import { ContextMenuItem } from "../../../types";
import { useStore } from "../../../stores/RootStore";
import Card from "../../../models/game/Card";
import { PointerEvent } from "react-three-fiber";
import { Color } from "three";
import PieceSet from "../../../models/game/PieceSet";
import { clone } from "mobx-keystone";
import { take } from "lodash";
import { useTranslation } from "react-i18next";
import pieceSetImage from "../../../assets/piece-set.png";

export type PieceSetProps = Omit<EntityProps, "geometry"> & {};

const height = 0.001;

export default observer((props: PieceSetProps) => {
  const { t } = useTranslation();
  const { gameStore, uiState, assetCache } = useStore();
  const { setDraggingEntity } = uiState;
  const { gameState } = gameStore;

  const { entity } = props;
  const pieceSet = entity as PieceSet;
  const {
    containedEntities,
    allEntities,
    name,
    prototypes,
    externalEntities,
    savedDeal
  } = pieceSet;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: t("contextMenu.reset"),
      type: "action",
      action: () => pieceSet.reset()
    }
  ];

  if (containedEntities.length > 0) {
    const items: ContextMenuItem[] = [
      {
        label: t("contextMenu.drawOne"),
        type: "action",
        action: () => pieceSet.drawOne()
      },
      {
        label: t("contextMenu.randomise"),
        type: "action",
        action: () => pieceSet.shuffle()
      }
    ];

    contextMenuItems.push(...items);
  }

  if (externalEntities.length > 0 && !gameState?.locked) {
    contextMenuItems.push({
      label: t("contextMenu.saveDeal"),
      type: "action",
      action: () => pieceSet.saveDeal()
    });
  }

  if (savedDeal) {
    contextMenuItems.push({
      label: t("contextMenu.restoreDeal"),
      type: "action",
      action: () => pieceSet.deal()
    });
  }

  const previewPrototypes = take(prototypes, 8).map(prototype =>
    clone(prototype)
  );

  let materialParams: MaterialParameters[] = [
    { opacity: 0 },
    { opacity: 0 },
    {
      roughness: 1,
      map: assetCache.getTexture(pieceSetImage)
    }
  ];

  const handleDrag = (e: PointerEvent) => {
    const piece = pieceSet.take(1);
    if (piece.length > 0) uiState.setDraggingEntity(piece[0]);
  };

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={
        <cylinderBufferGeometry
          args={[0.5, 0.5, height, 30]}
          attach="geometry"
        />
      }
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      dragAction={containedEntities.length > 0 ? handleDrag : undefined}
      hoverMessage={`${name} (${containedEntities.length})`}
      castShadows={false}
    >
      {previewPrototypes &&
        previewPrototypes.map((prototype, i) => {
          const radius = previewPrototypes.length > 1 ? 0.25 : 0;
          const angle = (i / previewPrototypes.length) * Math.PI * 2;

          return prototype.render({
            key: i,
            blockInteraction: true,
            entity: prototype,
            positionOffset: [
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ],
            angle
          });
        })}
    </Entity>
  );
});
