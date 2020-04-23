import { observer } from "mobx-react";
import React, { useEffect } from "react";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import Deck from "../../../models/game/Deck";
import { cardHeight } from "./Card";
import { ContextMenuItem } from "../../../types";
import { useStore } from "../../../stores/RootStore";
import Card from "../../../models/game/Card";
import CardComponent from "./Card";
import { PointerEvent } from "react-three-fiber";
import { Color } from "three";
import defaultCardBack from "../../../assets/default-back.png";

export type DeckProps = Omit<EntityProps, "geometry"> & {};

export default observer((props: DeckProps) => {
  const { gameStore, uiState, assetCache } = useStore();
  const { setDraggingEntity } = uiState;
  const { gameState } = gameStore;

  const { entity } = props;
  const deck = entity as Deck;
  const { containedEntities, name, externalEntities, savedDeal } = deck;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Reset",
      type: "action",
      action: () => deck.reset()
    }
  ];

  if (containedEntities.length > 0) {
    const items: ContextMenuItem[] = [
      {
        label: "Take one",
        type: "action",
        action: () => deck.take(1)
      },
      {
        label: "Draw one",
        type: "action",
        action: () => deck.take(1)
      },
      {
        label: "Flip",
        type: "action",
        action: () => deck.flip()
      },
      {
        label: "Shuffle",
        type: "action",
        action: () => deck.shuffle()
      }
    ];

    contextMenuItems.push(...items);
  }

  if (externalEntities.length > 0) {
    contextMenuItems.push({
      label: "Save deal",
      type: "action",
      action: () => deck.saveDeal()
    });
  }

  if (savedDeal) {
    contextMenuItems.push({
      label: "Deal",
      type: "action",
      action: () => deck.deal()
    });
  }

  let height = cardHeight * Math.max(containedEntities.length, 1);

  const handleDrag = (e: PointerEvent) => {
    const card = deck.take(1);
    if (card.length > 0) uiState.setDraggingEntity(card[0]);
  };

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={<boxBufferGeometry args={[0.7, height, 1]} attach="geometry" />}
      materialParams={{
        roughness: 1,
        color: "white"
      }}
      contextMenuItems={contextMenuItems}
      dragAction={containedEntities.length > 0 ? handleDrag : undefined}
      hoverMessage={`${name} (${containedEntities.length})`}
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
