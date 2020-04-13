import { observer } from "mobx-react";
import React from "react";
import Entity, { EntityProps } from "./Entity";
import Material from "./Material";

export type CardProps = Omit<EntityProps, "geometry" | "material"> & {
  frontImageUrl: string;
  backImageUrl: string;
  faceUp: boolean;
};

const height = 0.005;

export default observer((props: CardProps) => {
  const { frontImageUrl, backImageUrl } = props;

  return (
    <Entity
      {...props}
      pivot={[0, -height / 2, 0]}
      geometry={<boxBufferGeometry args={[0.7, height, 1]} attach="geometry" />}
      material={
        <Material
          textureUrl={frontImageUrl}
          params={{
            roughness: 0.2
          }}
        />
      }
    />
  );
});
