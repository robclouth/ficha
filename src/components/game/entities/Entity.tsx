import { observer } from "mobx-react";
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef
} from "react";
import { useTranslation } from "react-i18next";
import { a, SpringValue } from "react-spring/three";
import { Dom, PointerEvent } from "react-three-fiber";
import {
  BufferGeometry,
  MeshStandardMaterial,
  MeshStandardMaterialParameters,
  Quaternion,
  Mesh,
  Box3
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
  showSnapPoints?: boolean;
};

let clickCount = 0;
let singleClickTimer: any;

export default observer((props: EntityProps) => {
  const { t } = useTranslation();
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
    ownerSet,
    locked,
    faceUp,
    isDragging,
    isOtherPlayerControlling,
    editable,
    handArea,
    isSelected
  } = entity;
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [rotating, setRotating] = useState(false);

  const [boundingBox, setBoundingBox] = useState<Box3 | undefined>(undefined);

  const [pointerDownPos, setPointerDownPos] = React.useState({ x: 0, y: 0 });

  const standardItems: Array<ContextMenuItem | false> = [
    {
      label: t("contextMenu.rotateClockwise"),
      type: "action",
      action: () => entity.rotate(Math.PI / 2)
    },
    {
      label: t("contextMenu.rotateCounterClockwise"),
      type: "action",
      action: () => entity.rotate(-Math.PI / 2)
    },
    editable &&
      !gameState.locked && {
        label: t("contextMenu.edit"),
        type: "edit",
        target:
          entity.prototype?.maybeCurrent !== undefined
            ? entity.prototype?.maybeCurrent
            : entity
      },
    !gameState.locked && {
      label: t("contextMenu.duplicate"),
      type: "action",
      action: () => entity.duplicate()
    },
    editable &&
      !gameState.locked && {
        label: t("contextMenu.addToLibrary"),
        type: "action",
        action: () => entityLibrary.addEntity(entity)
      },
    !gameState.locked && {
      label: locked ? t("contextMenu.unlock") : t("contextMenu.lock"),
      type: "action",
      action: () => entity.toggleLocked()
    },
    deletable &&
      !gameState.locked && {
        label: t("contextMenu.delete"),
        type: "action",
        action: () => gameState.removeEntity(entity)
      }
  ];

  let contextMenuItems = props.contextMenuItems
    ? [...props.contextMenuItems, ...standardItems]
    : standardItems;

  const allContextMenuItems = contextMenuItems.filter(
    item => item !== false
  ) as ContextMenuItem[];

  allContextMenuItems.forEach(item => {
    if (!item.target) item.target = entity;
  });

  uiState.registerContextMenuItems(entity, allContextMenuItems);

  const handlePointerDown = (e: any) => {
    setPointerDownPos({
      x: e.clientX,
      y: e.clientY
    });
    e.stopPropagation();
    if (e.button === 0) {
      if (!isOtherPlayerControlling) {
        setPressed(true);
        e.target.setPointerCapture(e.pointerId);

        if (!isSelected && Object.values(uiState.selectedEntities).length > 0) {
          uiState.deselectAll();
        }

        if (clickCount === 1) {
          setRotating(true);
          uiState.startUndoGroup();
        }
      }
    }
  };

  const handlePointerUp = (e: any) => {
    const distance = Math.sqrt(
      Math.pow(e.clientX - pointerDownPos.x, 2) +
        Math.pow(e.clientY - pointerDownPos.y, 2)
    );
    if (e.button === 0) {
      uiState.setDraggingEntity();
      setPressed(false);
      setRotating(false);
      e.target.releasePointerCapture(e.pointerId);
      uiState.endUndoGroup();

      if (distance < 10 && !locked) {
        handleSelect();

        clickCount++;
        if (clickCount === 1) {
          singleClickTimer = setTimeout(() => {
            clickCount = 0;
            handleSingleClick(e);
          }, 300);
        } else if (clickCount === 2) {
          clearTimeout(singleClickTimer);
          clickCount = 0;
          handleDoubleClick(e);
        }
      }
    } else if (e.button === 2 && distance < 10) {
      uiState.openContextMenu(e, allContextMenuItems, entity);
      e.stopPropagation();
    }
  };

  const handlePointerMove = (e: any) => {
    const distance = Math.sqrt(
      Math.pow(e.clientX - pointerDownPos.x, 2) +
        Math.pow(e.clientY - pointerDownPos.y, 2)
    );

    if (distance > 20) {
      singleClickTimer && clearTimeout(singleClickTimer);
      clickCount = 0;
      if (rotating) uiState.deselectEntity(entity);
    }

    if (rotating) {
      entity.angle += e.movementY / 100;
    }

    if (!rotating && !isDragging && pressed) {
      if (!locked) {
        e.stopPropagation();
        uiState.setDraggingEntity(entity);
      } else if (dragAction) {
        uiState.isStartingDrag = true;

        if (distance > 5) {
          dragAction(e);
          uiState.isStartingDrag = false;
          setPressed(false);
          e.target.releasePointerCapture(e.pointerId);
        }
      }
    }
  };

  const handleMouseWheel = (e: any) => {
    // if (isDragging) {
    //   entity.angle += e.deltaY / 500;
    // }
  };

  const handleSelect = () => {
    if (!isSelected) uiState.selectEntity(entity);
    else uiState.deselectEntity(entity);
  };
  const handleSingleClick = (e: PointerEvent) => {};

  const handleDoubleClick = (e: PointerEvent) => {
    doubleClickAction && doubleClickAction(e);
  };

  const handleClick = (e: PointerEvent) => {};

  const handlePointerHoverOver = (e: PointerEvent) => {
    uiState.setHoveredEntity(entity);
    setHovered(true);
  };

  const handlePointerHoverOut = (e: PointerEvent) => {
    uiState.setHoveredEntity();
    setHovered(false);
  };

  const mesh = useRef<Mesh>();

  useEffect(() => {
    const boundingBox = new Box3();
    boundingBox.setFromObject(mesh.current!);
    boundingBox.min.y = 0;
    entity.updateBoundingBox(boundingBox);
    entity.worldMatrix = mesh.current?.matrixWorld;
    setBoundingBox(boundingBox);
  }, [
    JSON.stringify(mesh.current?.matrixWorld) +
      (!entity.boundingBox ? Math.random() : "")
  ]);

  const faded = isSelected;

  function createMaterial(params: any) {
    // remove undefined params
    Object.keys(params).forEach(key =>
      params[key] === undefined ? delete params[key] : {}
    );

    const newParams = {
      transparent: true,
      opacity: (params.opacity ?? 1) * (faded ? 0.5 : 1)
    };

    return new MeshStandardMaterial({
      ...params,
      ...newParams
    });
  }

  const materials = useMemo(() => {
    if (Array.isArray(materialParams))
      return (materialParams as MaterialParameters[]).map(params =>
        createMaterial(params)
      );
    else return createMaterial(materialParams);
  }, [JSON.stringify(materialParams), faded]);

  const inOtherPlayersArea =
    handArea &&
    (handArea as HandArea).player &&
    (handArea as HandArea).player !== gameStore.thisPlayer;
  const visible = !inOtherPlayersArea;

  const events = !blockInteraction
    ? {
        onPointerDown: !inOtherPlayersArea ? handlePointerDown : undefined,
        onPointerUp: handlePointerUp,
        onPointerMove: !inOtherPlayersArea ? handlePointerMove : undefined,
        onPointerOver: !inOtherPlayersArea ? handlePointerHoverOver : undefined,
        onPointerOut: handlePointerHoverOut,
        onWheel: !inOtherPlayersArea ? handleMouseWheel : undefined,
        onClick: !inOtherPlayersArea ? handleClick : undefined
      }
    : undefined;

  const scale = entity.getScale();

  return (
    <>
      {/* {boundingBox && <box3Helper box={boundingBox} />} */}
      <a.group position={positionOffset} visible={visible}>
        <group
          position={[position.x, position.y, position.z]}
          rotation={[0, angle, 0]}
          scale={[scale.x, scale.y, scale.z]}
          ref={mesh}
        >
          <group position={[-pivot[0], -pivot[1], -pivot[2]]}>
            <group rotation={[faceUp ? Math.PI : 0, 0, 0]}>
              <a.mesh
                userData={{ entity }}
                quaternion={rotationOffset}
                {...events}
                castShadow={castShadows}
                receiveShadow
              >
                {geometry}
                {Array.isArray(materials) ? (
                  (materials as MeshStandardMaterial[]).map((material, i) => (
                    <primitive
                      key={i}
                      attachArray="material"
                      object={material}
                    />
                  ))
                ) : (
                  <primitive attach="material" object={materials} />
                )}
              </a.mesh>
            </group>
          </group>
          {visible && children}
          {hoverMessage && hovered && visible && (
            <Dom
              position={[0, 1 / scale.y, 0]}
              center
              style={{ pointerEvents: "none", userSelect: "none" }}
              onContextMenu={() => false}
            >
              <h3
                style={{
                  pointerEvents: "none",
                  userSelect: "none",
                  textShadow: "0px 0px 4px black"
                }}
                onContextMenu={() => false}
              >
                {hoverMessage}
              </h3>
            </Dom>
          )}
        </group>
      </a.group>
    </>
  );
});
