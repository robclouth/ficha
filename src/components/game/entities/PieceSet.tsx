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
import PieceSet from "../../../models/game/PieceSet";
import { clone } from "mobx-keystone";
import { take } from "lodash";

export type PieceSetProps = Omit<EntityProps, "geometry"> & {};

const height = 0.2;

export default observer((props: PieceSetProps) => {
  const { gameStore, uiState, assetCache } = useStore();
  const { setDraggingEntity } = uiState;
  const { gameState } = gameStore;

  const { entity } = props;
  const pieceSet = entity as PieceSet;
  const {
    containedEntities: entities,
    allEntities,
    name,
    prototypes
  } = pieceSet;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Reset",
      type: "action",
      action: () => pieceSet.reset()
    }
  ];

  if (entities.length > 0) {
    const items: ContextMenuItem[] = [
      {
        label: "Take one",
        type: "action",
        action: () => pieceSet.take(1)
      },
      {
        label: "Draw one",
        type: "action",
        action: () => pieceSet.take(1)
      },
      {
        label: "Shuffle",
        type: "action",
        action: () => pieceSet.shuffle()
      }
    ];

    contextMenuItems.push(...items);
  }

  if (allEntities.length > 0) {
    contextMenuItems.push({
      label: "Shuffle placed",
      type: "action",
      action: () => pieceSet.shuffleAll()
    });
  }

  const previewPrototypes = take(prototypes, 8).map(prototype =>
    clone(prototype)
  );

  let materialParams: MaterialParameters = {
    roughness: 1,
    color: new Color(0.6, 0.6, 0.6)
  };

  const handleDrag = (e: PointerEvent) => {
    const piece = pieceSet.take(1);
    uiState.setDraggingEntity(piece);
  };

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={
        <cylinderBufferGeometry
          args={[0.5, 0.5, height, 20]}
          attach="geometry"
        />
      }
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      dragAction={entities.length > 0 ? handleDrag : undefined}
      hoverMessage={`${name} (${entities.length})`}
    >
      {previewPrototypes &&
        previewPrototypes.map((prototype, i) => {
          const radius = previewPrototypes.length > 1 ? 0.25 : 0;
          const angle = (i / previewPrototypes.length) * Math.PI * 2;

          return prototype.render({
            key: i,
            preview: true,
            entity: prototype,
            position: [0, 0],
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
