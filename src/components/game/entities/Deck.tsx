import { observer } from "mobx-react";
import React from "react";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import Deck from "../../../models/game/Deck";
import { cardHeight } from "./Card";
import { ContextMenuItem } from "../../../types";

export type DeckProps = Omit<EntityProps, "geometry"> & {};

export default observer((props: DeckProps) => {
  const { entity } = props;
  const deck = entity as Deck;
  const { cards } = deck;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Shuffle",
      action: () => deck.shuffle()
    }
  ];

  let height = cardHeight * cards.length;

  const edgeMaterialParams = {
    roughness: 1
    // color: "white"
  };

  const materialParams: MaterialParameters[] = [
    edgeMaterialParams,
    edgeMaterialParams,
    {
      roughness: 0.2,
      textureUrl: cards[0].backImageUrl
    },
    {
      roughness: 0.2,
      textureUrl: cards[0].frontImageUrl
    },
    edgeMaterialParams,
    edgeMaterialParams
  ];

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={<boxBufferGeometry args={[0.7, height, 1]} attach="geometry" />}
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
    />
  );
});
