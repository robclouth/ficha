import { range } from "lodash";
import { observer } from "mobx-react";
import React from "react";
import { Color } from "three";
import Board from "../../../models/game/Board";
import { useStore } from "../../../stores/RootStore";
import Entity, { EntityProps, MaterialParameters } from "./Entity";

export type BoardProps = Omit<EntityProps, "geometry"> & {};

export const height = 0.01;

export default observer((props: BoardProps) => {
  const { assetCache } = useStore();
  const { entity } = props;
  const { frontImageUrl } = entity;

  const edgeMaterial: MaterialParameters = {
    roughness: 1,
    color: new Color(1, 1, 1)
  };

  const frontMaterial: MaterialParameters = {
    roughness: 0.2,
    map: assetCache.getTexture(frontImageUrl)
  };

  const materialParams = range(6).map(i => edgeMaterial);
  materialParams[3] = frontMaterial;

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={<boxBufferGeometry args={[1, height, 1]} attach="geometry" />}
      materialParams={materialParams}
      contextMenuItems={[]}
      castShadows={false}
    ></Entity>
  );
});
