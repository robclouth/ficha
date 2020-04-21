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

export type PieceSetProps = Omit<EntityProps, "geometry"> & {};

const height = 0.2;

export default observer((props: PieceSetProps) => {
  const { gameStore, uiState, assetCache } = useStore();
  const { setDraggingEntity } = uiState;
  const { gameState } = gameStore;

  const { entity } = props;
  const pieceSet = entity as PieceSet;
  const { entities, allEntities, name } = pieceSet;

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

  const firstEntity =
    allEntities.length > 0 ? clone(allEntities[0]) : undefined;

  let materialParams: MaterialParameters = {
    roughness: 1,
    color: firstEntity
      ? new Color(firstEntity.color.r, firstEntity.color.g, firstEntity.color.b)
      : new Color(1, 1, 1)
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
      {firstEntity &&
        firstEntity.render({
          preview: true,
          entity: firstEntity,
          yOffset: height,
          position: [0, 0],
          angle: 0
        })}
    </Entity>
  );
});
