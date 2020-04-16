import { observer } from "mobx-react";
import React, { Suspense } from "react";
import {
  BufferGeometry,
  Color,
  MeshStandardMaterialParameters,
  Texture,
  TextureLoader,
  Plane,
  Vector3,
  MeshStandardMaterial
} from "three";
import { PointerEvent, useLoader } from "react-three-fiber";
import { useStore } from "../../../stores/RootStore";
import Entity from "../../../models/game/Entity";
import { ContextMenuItem } from "../../../types";
import Material from "../Material";

export type MaterialParameters = MeshStandardMaterialParameters & {
  textureUrl?: string;
};

export type EntityProps = {
  entity: Entity;
  onContextMenu: (
    event: PointerEvent,
    contextMenuItems: ContextMenuItem[]
  ) => void;
  contextMenuItems?: ContextMenuItem[];
  pivot?: [number, number, number];
  flipped?: boolean;
  geometry: React.ReactElement<BufferGeometry>;
  materialParams?: MaterialParameters[];
};

export default observer((props: EntityProps) => {
  const { gameStore, uiState } = useStore();
  const { gameState } = gameStore;

  const {
    entity,
    geometry,
    materialParams = [{}],
    pivot = [0, 0, 0],
    flipped = false,
    onContextMenu
  } = props;
  const { position, angle, scale, color } = entity;

  const [hovered, setHover] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

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
      label: "Delete",
      type: "action",
      action: () => gameState.removeEntity(entity)
    }
  ];

  const contextMenuItems = props.contextMenuItems
    ? [...props.contextMenuItems, ...standardItems]
    : standardItems;

  const handlePointerDown = (event: any) => {
    if (event.button === 0) {
      event.stopPropagation();
      uiState.setDraggingEntity(entity);
      setDragging(true);
    }
    event.target.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: any) => {
    if (event.button === 0) {
      uiState.setDraggingEntity(null);
      event.target.releasePointerCapture(event.pointerId);
      setDragging(false);
    } else if (event.button === 2) {
      onContextMenu(event, contextMenuItems);
      event.stopPropagation();
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (dragging) {
      let point = new Vector3();
      event.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), point);
      entity.position = [point.x, point.z];
    }
  };

  return (
    <group
      position={[position[0], 0, position[1]]}
      rotation={[0, angle, 0]}
      scale={[scale, scale, scale]}
    >
      <mesh
        position={[-pivot[0], -pivot[1], -pivot[2]]}
        rotation={[flipped ? Math.PI : 0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={e => setHover(true)}
        onPointerOut={e => setHover(false)}
      >
        {geometry}
        {materialParams.map((params, i) => {
          const updatedParams: MaterialParameters = {
            ...params,
            color: new Color(color[0], color[1], color[2]),
            transparent: true,
            opacity: hovered ? 0.5 : 1
          };

          const material = <Material key={i} {...updatedParams} />;

          return material;
        })}
      </mesh>
    </group>
  );
});
