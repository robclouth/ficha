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
import defaultCardBack from "../../../assets/default-back.png";

export type DeckProps = Omit<EntityProps, "geometry"> & {};

export default observer((props: DeckProps) => {
  const { gameStore, uiState, assetCache } = useStore();
  const { setDraggingEntity } = uiState;
  const { gameState } = gameStore;

  const { entity } = props;
  const deck = entity as Deck;
  const { cards, allCards } = deck;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Reset",
      type: "action",
      action: () => deck.reset()
    }
  ];

  if (cards.length > 0) {
    const items: ContextMenuItem[] = [
      {
        label: "Take one",
        type: "action",
        action: () => deck.takeCards(1)
      },
      {
        label: "Draw one",
        type: "action",
        action: () => deck.takeCards(1)
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

  if (allCards.length > 0) {
    contextMenuItems.push({
      label: "Shuffle placed",
      type: "action",
      action: () => deck.shufflePlaced()
    });
  }

  let height = cardHeight * Math.max(cards.length, 1);

  const edgeMaterialParams = {
    roughness: 1
    // color: "white"
  };

  let materialParams: MaterialParameters[];
  if (cards.length > 0) {
    const frontTexture = cards[0].frontImageUrl
      ? assetCache.getTexture(cards[0].frontImageUrl)
      : undefined;

    const backTexture = cards[0].backImageUrl
      ? assetCache.getTexture(cards[0].backImageUrl)
      : assetCache.getTexture(defaultCardBack, false);

    const color = cards[0].color;
    materialParams = [
      edgeMaterialParams,
      edgeMaterialParams,
      {
        roughness: 0.2,
        map: backTexture,
        color: new Color(1, 1, 1)
      },
      {
        roughness: 0.2,
        map: frontTexture,
        color: new Color(color.r, color.g, color.b)
      },
      edgeMaterialParams,
      edgeMaterialParams
    ];
  } else {
    materialParams = [
      edgeMaterialParams,
      edgeMaterialParams,
      {
        roughness: 0.2,
        map: undefined,
        color: new Color(1, 0, 1)
      },
      {
        roughness: 0.2,
        map: undefined,
        color: new Color(1, 0, 1)
      },
      edgeMaterialParams,
      edgeMaterialParams
    ];
  }

  const handleDrag = (e: PointerEvent) => {
    const card = deck.takeCards(1);
    uiState.setDraggingEntity(card);
  };

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={<boxBufferGeometry args={[0.7, height, 1]} attach="geometry" />}
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      dragAction={cards.length > 0 ? handleDrag : undefined}
    />
  );
});
