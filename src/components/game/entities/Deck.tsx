import { observer } from "mobx-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PointerEvent } from "react-three-fiber";
import Deck from "../../../models/game/Deck";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import deckEmpty from "../../../assets/deck-empty.png";

import CardComponent, {
  cardHeight,
  makeShape,
  drawCanvas,
  getMaterialParams
} from "./Card";
import Entity, { EntityProps } from "./Entity";
import { clone } from "mobx-keystone";
import Card from "../../../models/game/Card";

export type DeckProps = Omit<EntityProps, "geometry"> & {};

export default observer((props: DeckProps) => {
  const { t } = useTranslation();
  const { gameStore, uiState, assetCache } = useStore();

  const { entity } = props;
  const deck = entity as Deck;
  const {
    containedEntities,
    name,
    externalEntities,
    savedDeal,
    gameState,
    shape
  } = deck;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: t("contextMenu.reset"),
      type: "action",
      action: () => deck.reset()
    }
  ];

  if (containedEntities.length > 0) {
    const items: ContextMenuItem[] = [
      {
        label: t("contextMenu.drawOne"),
        type: "action",
        action: () => deck.drawOne()
      },
      {
        label: t("contextMenu.flip"),
        type: "action",
        action: () => deck.flip()
      },
      {
        label: t("contextMenu.shuffle"),
        type: "action",
        action: () => deck.shuffle()
      }
    ];

    contextMenuItems.push(...items);
  }

  if (externalEntities.length > 0 && !gameState?.locked) {
    contextMenuItems.push({
      label: t("contextMenu.saveDeal"),
      type: "action",
      action: () => deck.saveDeal()
    });
  }

  if (savedDeal) {
    contextMenuItems.push({
      label: t("contextMenu.restoreDeal"),
      type: "action",
      action: () => deck.deal()
    });
  }

  let height =
    containedEntities.length > 0
      ? cardHeight * containedEntities.length
      : 0.001;

  const handleDrag = (e: PointerEvent) => {
    const card = deck.take(1);
    if (card.length > 0) uiState.setDraggingEntity(card[0]);
  };

  let frontMaterial, backMaterial, edgeMaterial;

  if (containedEntities.length > 0) {
    const card = containedEntities[0] as Card;
    const canvasTexture = assetCache.getCardTexture(card);

    const params = getMaterialParams(card, assetCache, canvasTexture);

    frontMaterial = params.frontMaterial;
    backMaterial = params.backMaterial;
    edgeMaterial = params.edgeMaterial;
  } else {
    frontMaterial = {
      map: assetCache.getTexture(deckEmpty)
    };
    backMaterial = {
      map: assetCache.getTexture(deckEmpty)
    };
    edgeMaterial = {
      opacity: 0
    };
  }

  const { geometry, materialParams, rotationOffset } = makeShape(
    shape,
    frontMaterial,
    backMaterial,
    edgeMaterial,
    height
  );

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={geometry}
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      dragAction={containedEntities.length > 0 ? handleDrag : undefined}
      hoverMessage={`${name} (${containedEntities.length})`}
      rotationOffset={rotationOffset}
      castShadows={containedEntities.length > 1}
    ></Entity>
  );
});
