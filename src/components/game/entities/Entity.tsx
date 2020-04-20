import { observer } from "mobx-react";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { PointerEvent, Dom } from "react-three-fiber";
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
  materialParams?: MaterialParameters | MaterialParameters[];
  materials?: React.ReactNode;
  deletable?: boolean;
  castShadows?: boolean;
  children?: React.ReactNode;
  hoverMessage?: string;
};

let clickCount = 0;
let singleClickTimer: any;

export default observer((props: EntityProps) => {
  const { gameStore, uiState, entityLibrary } = useStore();
  const { gameState } = gameStore;

  const {
    entity,
    geometry,
    dragAction,
    doubleClickAction,
    children,
    hoverMessage,
    castShadows = true,
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
      label: "Add to library",
      type: "action",
      action: () => entityLibrary.addEntity(entity)
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
      setPressed(true);
      e.target.setPointerCapture(e.pointerId);

      if (!isOtherPlayerControlling) {
        setPointerDownPos({
          x: e.clientX,
          y: e.clientY
        });
      }
    }
  };

  const handlePointerUp = (e: any) => {
    if (e.button === 0) {
      if (isDragging) uiState.setDraggingEntity();
      setPressed(false);
      e.target.releasePointerCapture(e.pointerId);
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
      } else if (dragAction) {
        uiState.isStartingDrag = true;
        const distance = Math.sqrt(
          Math.pow(e.clientX - pointerDownPos.x, 2) +
            Math.pow(e.clientY - pointerDownPos.y, 2)
        );

        if (distance > 5) {
          dragAction(e);
          uiState.isStartingDrag = false;
          setPressed(false);
          e.target.releasePointerCapture(e.pointerId);
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

  const renderMaterial = (params: MaterialParameters, i?: number) => {
    const updatedParams: MaterialParameters = {
      ...params,
      transparent: true,
      opacity: hovered ? 0.7 : 1
    };
    const key =
      i &&
      Object.values(updatedParams)
        .map(value => (value ? value.toString() : ""))
        .join() + i;
    // console.log(key);
    const material = (
      <meshStandardMaterial
        key={key}
        attachArray={i !== undefined ? "material" : undefined}
        attach={i === undefined ? "material" : undefined}
        {...(updatedParams as any)}
      />
    );

    return material;
  };

  return (
    <group
      position={[position[0], minHeight, position[1]]}
      rotation={[0, angle, 0]}
      scale={[scale.x, scale.y, scale.z]}
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
        castShadow={castShadows}
        receiveShadow
      >
        {geometry}
        {Array.isArray(materialParams)
          ? materialParams.map(renderMaterial)
          : renderMaterial(materialParams)}
      </mesh>
      {children}
      {hoverMessage && hovered && (
        <Dom position={[0, 0, 0]} center>
          <h3>{hoverMessage}</h3>
        </Dom>
      )}
    </group>
  );
});
