import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { BufferGeometry, Color, Quaternion, Object3D, Vector3 } from "three";
import Piece, { Shape } from "../../../models/game/Piece";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import { range } from "lodash";

export type PieceProps = Omit<EntityProps, "geometry"> & {};

export const size = 0.1;

export function makeShape(
  shape: Shape,
  shapeParam1: number,
  shapeParam2: number,
  frontMaterial: MaterialParameters,
  edgeMaterial: MaterialParameters
) {
  let materialParams: MaterialParameters[] | MaterialParameters = edgeMaterial;
  let rotationOffset = new Quaternion();
  let yOffset = 0;
  let geometry: React.ReactElement<BufferGeometry>;

  if (shape === Shape.Cube) {
    geometry = (
      <boxBufferGeometry args={[size, size, size]} attach="geometry" />
    );
    materialParams = range(6).map(i => edgeMaterial);
    materialParams[3] = frontMaterial;
  } else if (shape === Shape.Cylinder) {
    geometry = (
      <cylinderBufferGeometry
        args={[size / 2, size / 2, size, shapeParam1]}
        attach="geometry"
      />
    );
    materialParams = range(3).map(i => edgeMaterial);
    materialParams[2] = frontMaterial;
    rotationOffset.setFromAxisAngle(Object3D.DefaultUp, Math.PI / 2);
  } else if (shape === Shape.Cone) {
    geometry = (
      <coneBufferGeometry
        args={[size / 2, size, shapeParam1]}
        attach="geometry"
      />
    );
    rotationOffset.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);
  } else if (shape === Shape.Sphere) {
    geometry = (
      <sphereBufferGeometry args={[size / 2, 15, 15]} attach="geometry" />
    );
  } else if (shape === Shape.Ring) {
    geometry = (
      <torusBufferGeometry
        args={[size / 2, size / 7, shapeParam1, shapeParam2]}
        attach="geometry"
      />
    );
    yOffset = size / 2 - 0.015;
    rotationOffset.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
  } else if (shape === Shape.Tetrahedron) {
    geometry = (
      <tetrahedronBufferGeometry args={[size / 2]} attach="geometry" />
    );
  } else if (shape === Shape.Octahedron) {
    geometry = <octahedronBufferGeometry args={[size / 2]} attach="geometry" />;
  } else {
    geometry = (
      <dodecahedronBufferGeometry args={[size / 2]} attach="geometry" />
    );
  }

  return {
    geometry,
    materialParams,
    rotationOffset,
    yOffset
  };
}

export default observer((props: PieceProps) => {
  const { t } = useTranslation();
  const { assetCache } = useStore();
  const { entity } = props;
  const piece = entity as Piece;
  const {
    ownerSet,
    color,
    shape,
    shapeParam1,
    shapeParam2,
    gameState,
    imageUrl
  } = piece;

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

  const sideMaterial: MaterialParameters = {
    roughness: 1,
    color: new Color(color.r, color.g, color.b)
  };

  const frontMaterial: MaterialParameters = {
    roughness: 1,
    map: imageUrl ? assetCache.getTexture(imageUrl) : undefined,
    color: new Color(color.r, color.g, color.b)
  };

  const { geometry, materialParams, rotationOffset, yOffset } = makeShape(
    shape,
    shapeParam1,
    shapeParam2,
    frontMaterial,
    sideMaterial
  );

  return (
    <Entity
      {...props}
      pivot={[0, -size / 2 + yOffset, 0]}
      geometry={geometry}
      materialParams={materialParams}
      rotationOffset={rotationOffset}
      contextMenuItems={contextMenuItems}
    />
  );
});
