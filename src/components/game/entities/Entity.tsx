import { observer } from "mobx-react";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { PointerEvent } from "react-three-fiber";
import {
  Box3,
  BufferGeometry,
  Color,
  Mesh,
  MeshStandardMaterialParameters,
  Plane,
  Vector3
} from "three";
import Entity from "../../../models/game/Entity";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";

export type MaterialParameters = MeshStandardMaterialParameters;

export type EntityProps = {
  entity: Entity;
  dragAction?: (e: PointerEvent) => void;
  doubleClickAction?: (e: PointerEvent) => void;
  contextMenuItems?: ContextMenuItem[];
  pivot?: [number, number, number];
  geometry: React.ReactElement<BufferGeometry>;
  materialParams?: MaterialParameters[];
  deletable?: boolean;
};

let clickCount = 0;
let singleClickTimer: any;

export default observer((props: EntityProps) => {
  const { gameStore, uiState } = useStore();
  const { gameState } = gameStore;

  const {
    entity,
    geometry,
    dragAction,
    doubleClickAction,
    materialParams = [{}],
    pivot = [0, 0, 0],
    deletable = true
  } = props;
  const {
    position,
    angle,
    scale,
    color,
    locked,
    boundingBox,
    faceUp,
    isDragging,
    isOtherPlayerControlling
  } = entity;

  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const [pointerDownPos, setPointerDownPos] = React.useState({ x: 0, y: 0 });

  const standardItems: ContextMenuItem[] = [
    {
      label: "Rotate clockwise",
      type: "action",
      action: () => entity.rotate(Math.PI / 2)
    },
    {
      label: "Rotate counter-clockwise",
      type: "action",
      action: () => entity.rotate(-Math.PI / 2)
    },
    {
      label: "Edit",
      type: "edit",
      target: entity,
      action: () => {}
    },
    {
      label: "Duplicate",
      type: "action",
      action: () => entity.duplicate()
    },
    {
      label: locked ? "Unlock" : "Lock",
      type: "action",
      action: () => entity.toggleLocked()
    }
  ];

  if (deletable) {
    standardItems.push({
      label: "Delete",
      type: "action",
      action: () => gameState.removeEntity(entity)
    });
  }

  const contextMenuItems = props.contextMenuItems
    ? [...props.contextMenuItems, ...standardItems]
    : standardItems;

  const handlePointerDown = (e: any) => {
    if (e.button === 0) {
      if (!isOtherPlayerControlling) {
        setPressed(true);
        setPointerDownPos({
          x: e.clientX,
          y: e.clientY
        });
      }
    }
  };

  const handlePointerUp = (e: any) => {
    if (e.button === 0) {
      uiState.setDraggingEntity();
      e.target.releasePointerCapture(e.pointerId);

      uiState.isDraggingEntity = false;
      setPressed(false);
    } else if (e.button === 2) {
      uiState.openContextMenu(e, contextMenuItems, entity);
      e.stopPropagation();
    }
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging && pressed) {
      if (!locked) {
        e.stopPropagation();
        uiState.setDraggingEntity(entity);
        e.target.setPointerCapture(e.pointerId);
      } else {
        uiState.isStartingDrag = true;
        const distance = Math.sqrt(
          Math.pow(e.clientX - pointerDownPos.x, 2) +
            Math.pow(e.clientY - pointerDownPos.y, 2)
        );

        if (distance > 5 && dragAction) {
          dragAction(e);
          uiState.isStartingDrag = false;

          setPressed(false);
          e.target.setPointerCapture(e.pointerId);
        } else {
        }
      }
    }
  };

  const handleSingleClick = (e: PointerEvent) => {};

  const handleDoubleClick = (e: PointerEvent) => {
    doubleClickAction && doubleClickAction(e);
  };

  const handleClick = (e: PointerEvent) => {
    clickCount++;
    if (clickCount === 1) {
      singleClickTimer = setTimeout(() => {
        clickCount = 0;
        handleSingleClick(e);
      }, 400);
    } else if (clickCount === 2) {
      clearTimeout(singleClickTimer);
      clickCount = 0;
      handleDoubleClick(e);
    }
  };

  const handlePointerHoverOver = (e: PointerEvent) => {
    setHovered(true);
  };

  const handlePointerHoverOut = (e: PointerEvent) => {
    setHovered(false);
  };

  const mesh = useRef<Mesh>();

  useEffect(() => {
    if (mesh.current) {
      boundingBox.setFromObject(mesh.current);
      boundingBox.min.y = 0;
    }
  }, [mesh, position, geometry, angle, scale]);

  const minHeight = useMemo(() => {
    let minHeight = 0;
    if (boundingBox) {
      for (const otherEntity of gameState.entities) {
        if (otherEntity !== entity && otherEntity.boundingBox) {
          const collision = boundingBox.intersectsBox(otherEntity.boundingBox);
          if (collision && otherEntity.boundingBox.max.y > minHeight) {
            minHeight = otherEntity.boundingBox.max.y;
          }
        }
      }
    }

    return minHeight;
  }, [position, boundingBox]);

  return (
    <group
      position={[position[0], minHeight, position[1]]}
      rotation={[0, angle, 0]}
      scale={[scale, scale, scale]}
    >
      <mesh
        ref={mesh}
        position={[-pivot[0], -pivot[1], -pivot[2]]}
        rotation={[faceUp ? Math.PI : 0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={handlePointerHoverOver}
        onPointerOut={handlePointerHoverOut}
        onClick={handleClick}
      >
        {geometry}
        {materialParams.map((params, i) => {
          const updatedParams: MaterialParameters = {
            ...params,
            color: new Color(color.r, color.g, color.b),
            transparent: true,
            opacity: hovered ? 0.7 : 1
          };

          const material = (
            <meshStandardMaterial
              key={i}
              attachArray="material"
              {...(updatedParams as any)}
            />
          );

          return material;
        })}
      </mesh>
    </group>
  );
});
