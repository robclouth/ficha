import { observer } from "mobx-react";
import React, { useState } from "react";
import { BufferGeometry, Color } from "three";
import Material from "./Material";
import { PointerEvent } from "react-three-fiber";
import { useStore } from "../../../stores/RootStore";
import Entity from "../../../models/game/Entity";

export type EntityProps = {
  entity: Entity;
  pivot?: [number, number, number];
  geometry: React.ReactNode;
  material: React.ReactNode;
};

export default observer((props: EntityProps) => {
  const { uiState } = useStore();

  const { entity, geometry, pivot = [0, 0, 0] } = props;
  const { position, angle, scale, color } = entity;

  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const material = React.cloneElement(
    props.material as React.ReactElement<any>,
    {
      params: {
        color: new Color(color[0], color[1], color[2]),
        transparent: true,
        opacity: hovered ? 0.8 : 1
      }
    }
  );

  function onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    uiState.setDraggingEntity(true);
  }

  function onPointerUp(event: PointerEvent) {
    event.stopPropagation();
    uiState.setDraggingEntity(false);
  }

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
        onPointerUp={e => onPointerUp(e)}
        onPointerOver={e => setHover(true)}
        onPointerOut={e => setHover(false)}
      >
        {geometry}
        {material}
      </mesh>
    </group>
  );
});
