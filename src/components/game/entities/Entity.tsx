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
import Material from "../Material";

export type MaterialParameters = MeshStandardMaterialParameters & {
  textureUrl?: string;
};

export type EntityProps = {
  entity: Entity;
  dragAction?: (e: PointerEvent) => void;
  contextMenuItems?: ContextMenuItem[];
  pivot?: [number, number, number];
  geometry: React.ReactElement<BufferGeometry>;
  materialParams?: MaterialParameters[];
  deletable?: boolean;
};

export default observer((props: EntityProps) => {
  const { gameStore, uiState } = useStore();
  const { gameState } = gameStore;

  const {
    entity,
    geometry,
    dragAction,
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
    isOtherPlayerControlling
  } = entity;

  const [hovered, setHover] = useState(false);

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
      label: "Delete",
      type: "action",
      action: () => gameState.removeEntity(entity)
    },
    {
      label: locked ? "Unlock" : "Lock",
      type: "action",
      action: () => entity.toggleLocked()
    }
  ];

  const contextMenuItems = props.contextMenuItems
    ? [...props.contextMenuItems, ...standardItems]
    : standardItems;

  const handlePointerDown = (e: any) => {
    if (e.button === 0) {
      if (!isOtherPlayerControlling) {
        if (!locked) {
          e.stopPropagation();
          uiState.setDraggingEntity(entity);
          e.target.setPointerCapture(e.pointerId);
        } else {
          if (dragAction) {
            dragAction(e);
          } else {
          }
        }
      }
    }
  };

  const handlePointerUp = (e: any) => {
    if (e.button === 0) {
      uiState.setDraggingEntity();
      e.target.releasePointerCapture(e.pointerId);
    } else if (e.button === 2) {
      uiState.openContextMenu(e, contextMenuItems, entity);
      e.stopPropagation();
    }
  };

  const handlePointerHoverOver = (e: PointerEvent) => {
    setHover(true);
    e.stopPropagation();
  };

  const handlePointerHoverOut = (e: PointerEvent) => {
    setHover(false);
    e.stopPropagation();
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
        onPointerOver={handlePointerHoverOver}
        onPointerOut={handlePointerHoverOut}
      >
        {geometry}
        {materialParams.map((params, i) => {
          const updatedParams: MaterialParameters = {
            ...params,
            color: new Color(color[0], color[1], color[2]),
            transparent: true,
            opacity: hovered ? 0.7 : 1
          };

          const material = <Material key={i} {...updatedParams} />;

          return material;
        })}
      </mesh>
    </group>
  );
});
