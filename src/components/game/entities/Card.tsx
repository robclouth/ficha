import { observer } from "mobx-react";
import React from "react";
import Card from "../../../models/game/Card";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import { ContextMenuItem } from "../../../types";
import { useStore } from "../../../stores/RootStore";

export type CardProps = Omit<EntityProps, "geometry"> & {};

export const cardHeight = 0.005;

export default observer((props: CardProps) => {
  const { assetCache } = useStore();
  const { entity } = props;
  const card = entity as Card;
  const { frontImageUrl, backImageUrl } = card;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Flip",
      type: "action",
      action: () => entity.flip()
    },
    {
      label: "Return to deck",
      type: "action",
      action: () => card.returnToDeck()
    }
  ];

  const edgeMaterialParams = {
    roughness: 1
    // color: "white"
  };

  const materialParams: MaterialParameters[] = [
    edgeMaterialParams,
    edgeMaterialParams,
    {
      roughness: 0.2,
      map: assetCache.getTexture(backImageUrl)
    },
    {
      roughness: 0.2,
      map: assetCache.getTexture(frontImageUrl)
    },
    edgeMaterialParams,
    edgeMaterialParams
  ];

  return (
    <Entity
      {...props}
      pivot={[0, -cardHeight / 2, 0]}
      geometry={
        <boxBufferGeometry args={[0.7, cardHeight, 1]} attach="geometry" />
      }
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      deletable={false}
    />
  );
});
