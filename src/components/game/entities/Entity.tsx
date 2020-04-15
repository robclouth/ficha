import { observer } from "mobx-react";
import React, { useState, Suspense } from "react";
import {
  BufferGeometry,
  Color,
  MeshStandardMaterialParameters,
  Texture,
  TextureLoader
} from "three";
import { PointerEvent, useLoader } from "react-three-fiber";
import { useStore } from "../../../stores/RootStore";
import Entity from "../../../models/game/Entity";
import { ContextMenuItem } from "../../../types";

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
  geometry: React.ReactElement<BufferGeometry>;
  materialParams?: MaterialParameters[];
};

const TexturedMaterial = observer(
  (params: MaterialParameters & { textureUrl: string }) => {
    const texture = useLoader<Texture>(TextureLoader, params.textureUrl!);

    return (
      <meshStandardMaterial
        attachArray="material"
        args={[
          {
            ...params,
            map: texture
          }
        ]}
      />
    );
  }
);

export default observer((props: EntityProps) => {
  const { gameStore } = useStore();
  const { gameState } = gameStore;

  const {
    entity,
    geometry,
    materialParams = [{}],
    pivot = [0, 0, 0],
    onContextMenu
  } = props;
  const { position, angle, scale, color } = entity;

  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const standardItems = [
    {
      label: "Delete",
      action: () => gameState.removeEntity(entity)
    }
  ];

  const contextMenuItems = props.contextMenuItems
    ? [...props.contextMenuItems, ...standardItems]
    : standardItems;

  function onPointerDown(event: PointerEvent) {
    event.stopPropagation();

    // uiState.setDraggingEntity(true);
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (event.button === 2) {
      onContextMenu(event, contextMenuItems);
      event.stopPropagation();
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
        onClick={e => setActive(!active)}
        onPointerDown={e => onPointerDown(e)}
        onPointerUp={e => handlePointerUp(e)}
        onPointerOver={e => setHover(true)}
        onPointerOut={e => setHover(false)}
      >
        {geometry}
        {materialParams.map((params, i) => {
          const updatedParams: MaterialParameters = {
            ...params,
            color: new Color(color[0], color[1], color[2]),
            transparent: true,
            opacity: hovered ? 0.3 : 1
          };

          const textureUrl = params.textureUrl;
          delete updatedParams["textureUrl"];

          const material = (
            <meshStandardMaterial
              key={i}
              attachArray="material"
              args={[
                {
                  ...updatedParams
                }
              ]}
            />
          );
          return textureUrl ? (
            <Suspense key={i} fallback={material}>
              <TexturedMaterial {...updatedParams} textureUrl={textureUrl} />
            </Suspense>
          ) : (
            material
          );
        })}
      </mesh>
    </group>
  );
});
