import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { PointerEvent } from "react-three-fiber";
import Deck from "../../../models/game/Deck";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import CardComponent, { cardHeight, makeShape } from "./Card";
import Entity, { EntityProps } from "./Entity";

export type DeckProps = Omit<EntityProps, "geometry"> & {};

export default observer((props: DeckProps) => {
  const { t } = useTranslation();
  const { gameStore, uiState } = useStore();

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

  let height = cardHeight * Math.max(containedEntities.length, 1);

  const handleDrag = (e: PointerEvent) => {
    const card = deck.take(1);
    if (card.length > 0) uiState.setDraggingEntity(card[0]);
  };

  const edgeMaterial = {
    roughness: 1,
    color: "white"
  };

  const { geometry, materialParams, rotationOffset } = makeShape(
    shape,
    edgeMaterial,
    edgeMaterial,
    edgeMaterial
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
    >
      {containedEntities.length > 0 && (
        <CardComponent
          entity={containedEntities[0]}
          blockInteraction
          positionOffset={[0, height, 0]}
        />
      )}
    </Entity>
  );
});
