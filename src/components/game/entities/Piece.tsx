import { observer } from "mobx-react";
import React from "react";
import Card from "../../../models/game/Card";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import { ContextMenuItem } from "../../../types";
import { useStore } from "../../../stores/RootStore";
import defaultCardBack from "../../../assets/default-back.png";
import { Color, BufferGeometry } from "three";
import Piece from "../../../models/game/Piece";
import { Shape } from "../../../models/game/Entity";
import { $enum } from "ts-enum-util";

export type PieceProps = Omit<EntityProps, "geometry"> & {};

export const size = 0.1;

export default observer((props: PieceProps) => {
  const { assetCache } = useStore();
  const { entity } = props;
  const piece = entity as Piece;
  const { ownerSet, color, shape, shapeParam1, shapeParam2 } = piece;

  const contextMenuItems: ContextMenuItem[] = [];

  if (ownerSet) {
    contextMenuItems.push({
      label: "Return to set",
      type: "action",
      action: () => entity.returnToSet()
    });
    contextMenuItems.push({
      label: "Remove from set",
      type: "action",
      action: () => entity.removeFromSet()
    });
  }

  const materialParams = {
    roughness: 1,
    color: new Color(color.r, color.g, color.b)
  };

  let geometry: React.ReactElement<BufferGeometry>;
  if (shape === Shape.Cube)
    geometry = (
      <boxBufferGeometry args={[size, size, size]} attach="geometry" />
    );
  else if (shape === Shape.Cylinder)
    geometry = (
      <cylinderBufferGeometry
        args={[size / 2, size / 2, size, shapeParam1]}
        attach="geometry"
      />
    );
  else if (shape === Shape.Cone)
    geometry = (
      <coneBufferGeometry
        args={[size / 2, size, shapeParam1]}
        attach="geometry"
      />
    );
  else if (shape === Shape.Sphere)
    geometry = (
      <sphereBufferGeometry args={[size / 2, 15, 15]} attach="geometry" />
    );
  else if (shape === Shape.Ring)
    geometry = (
      <torusBufferGeometry
        args={[size / 2, size / 7, shapeParam1, shapeParam2]}
        attach="geometry"
      />
    );
  else if (shape === Shape.Tetrahedron)
    geometry = (
      <tetrahedronBufferGeometry args={[size / 2]} attach="geometry" />
    );
  else if (shape === Shape.Octahedron)
    geometry = <octahedronBufferGeometry args={[size / 2]} attach="geometry" />;
  else if (shape === Shape.Dodecahedron)
    geometry = (
      <dodecahedronBufferGeometry args={[size / 2]} attach="geometry" />
    );

  return (
    <Entity
      {...props}
      pivot={[0, -size / 2, 0]}
      geometry={geometry!}
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      deletable={ownerSet ? false : true}
      castShadows={false}
    />
  );
});
