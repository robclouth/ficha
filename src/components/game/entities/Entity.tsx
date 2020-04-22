import { observer } from "mobx-react";
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback
} from "react";
import { PointerEvent, Dom } from "react-three-fiber";
import { a, SpringValue } from "react-spring/three";

import {
  Box3,
  BufferGeometry,
  Color,
  Mesh,
  MeshStandardMaterialParameters,
  Plane,
  Vector3,
  Quaternion
} from "three";
import Entity from "../../../models/game/Entity";
import HandArea from "../../../models/game/HandArea";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";

export type MaterialParameters = MeshStandardMaterialParameters;

export type EntityProps = {
  entity: Entity;
  dragAction?: (e: PointerEvent) => void;
  doubleClickAction?: (e: PointerEvent) => void;
  contextMenuItems?: Array<ContextMenuItem | false>;
  pivot?: [number, number, number];
  geometry?: React.ReactElement<BufferGeometry>;
  materialParams?: MaterialParameters | MaterialParameters[];
  materials?: React.ReactNode;
  deletable?: boolean;
  castShadows?: boolean;
  children?: React.ReactNode;
  hoverMessage?: string;
  positionOffset?:
    | [number, number, number]
    | SpringValue<[number, number, number]>;
  rotationOffset?: Quaternion | SpringValue<[number, number, number, number]>;
  blockInteraction?: boolean;
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
    deletable = true,
    positionOffset = [0, 0, 0],
    rotationOffset,
    blockInteraction = false
  } = props;
  const {
    position,
    angle,
    scale,
    color,
    locked,
    faceUp,
    isDragging,
    isOtherPlayerControlling,
    editable,
    handArea
  } = entity;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const [pointerDownPos, setPointerDownPos] = React.useState({ x: 0, y: 0 });

  const standardItems: Array<ContextMenuItem | false> = [
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
    editable && {
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
    editable && {
      label: "Add to library",
      type: "action",
      action: () => entityLibrary.addEntity(entity)
    },
    {
      label: locked ? "Unlock" : "Lock",
      type: "action",
      action: () => entity.toggleLocked()
    },
    deletable && {
      label: "Delete",
      type: "action",
      action: () => gameState.removeEntity(entity)
    }
  ];

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
      uiState.setDraggingEntity();
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

  const mesh = useCallback(mesh => {
    if (mesh !== null) {
      entity.mesh = mesh;
      setTimeout(() => entity.updateBoundingBox(), 1);
      entity.updateBoundingBox();
    }
  }, []);

  const renderMaterial = useCallback(
    (params: MaterialParameters, i?: number) => {
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

      const material = (
        <meshStandardMaterial
          key={key}
          attachArray={i !== undefined ? "material" : undefined}
          attach={i === undefined ? "material" : undefined}
          {...(updatedParams as any)}
        />
      );

      return material;
    },
    [materialParams, hovered]
  );

  const inOtherPlayersArea =
    handArea && (handArea as HandArea).player !== gameStore.player;
  const visible = !inOtherPlayersArea;
  const interactive = !blockInteraction && !inOtherPlayersArea;

  return (
    <a.group position={positionOffset} visible={visible}>
      <group
        position={[position.x, position.y, position.z]}
        rotation={[0, angle, 0]}
        scale={[scale.x, scale.y, scale.z]}
      >
        <a.group position={[-pivot[0], -pivot[1], -pivot[2]]}>
          <a.mesh
            ref={mesh}
            quaternion={rotationOffset}
            rotation={rotationOffset ? undefined : [faceUp ? Math.PI : 0, 0, 0]}
            onPointerDown={interactive ? handlePointerDown : undefined}
            onPointerUp={handlePointerUp}
            onPointerMove={interactive ? handlePointerMove : undefined}
            onPointerOver={interactive ? handlePointerHoverOver : undefined}
            onPointerOut={handlePointerHoverOut}
            onClick={interactive ? handleClick : undefined}
            castShadow={castShadows}
            receiveShadow
          >
            {geometry}
            {Array.isArray(materialParams)
              ? materialParams.map(renderMaterial)
              : renderMaterial(materialParams)}
          </a.mesh>
        </a.group>

        {children}
        {hoverMessage && hovered && (
          <Dom
            position={[0, 1, 0]}
            center
            style={{ pointerEvents: "none", userSelect: "none" }}
            onContextMenu={() => false}
          >
            <h3
              style={{ pointerEvents: "none", userSelect: "none" }}
              onContextMenu={() => false}
            >
              {hoverMessage}
            </h3>
          </Dom>
        )}
      </group>
    </a.group>
  );
});
