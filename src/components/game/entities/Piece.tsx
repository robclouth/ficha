import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { BufferGeometry, Color } from "three";
import Piece, { Shape } from "../../../models/game/Piece";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import Entity, { EntityProps } from "./Entity";

export type PieceProps = Omit<EntityProps, "geometry"> & {};

export const size = 0.1;

export default observer((props: PieceProps) => {
  const { t } = useTranslation();
  const { assetCache } = useStore();
  const { entity } = props;
  const piece = entity as Piece;
  const { ownerSet, color, shape, shapeParam1, shapeParam2, gameState } = piece;

  const contextMenuItems: ContextMenuItem[] = [];

  if (ownerSet) {
    contextMenuItems.push({
      label: t("contextMenu.returnToSet"),
      type: "action",
      action: () => entity.returnToSet()
    });

    if (!gameState?.locked) {
      contextMenuItems.push({
        label: t("contextMenu.removeFromSet"),
        type: "action",
        action: () => entity.removeFromSet()
      });
    }
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
    />
  );
});
