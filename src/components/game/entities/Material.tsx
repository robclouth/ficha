import { observer } from "mobx-react";
import React, { Suspense } from "react";
import { useLoader } from "react-three-fiber";
import { MeshStandardMaterialParameters, Texture, TextureLoader } from "three";

export type MaterialProps = {
  textureUrl: string;
  params?: MeshStandardMaterialParameters;
};

const Material = observer(({ textureUrl, params }: MaterialProps) => {
  const texture = useLoader<Texture>(TextureLoader, textureUrl);

  return (
    <meshStandardMaterial
      args={[
        {
          ...params,
          map: texture
        }
      ]}
      attach="material"
    />
  );
});

export default observer((props: MaterialProps) => {
  return (
    <Suspense fallback={<meshStandardMaterial />}>
      <Material {...props} />
    </Suspense>
  );
});
