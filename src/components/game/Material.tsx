import { observer } from "mobx-react";
import { TextureLoader, MeshStandardMaterialParameters } from "three";
import { useLoader } from "react-three-fiber";
import React, { Suspense, useMemo } from "react";

export type MaterialParameters = MeshStandardMaterialParameters & {
  textureUrl?: string;
};

const Texture = ({ url }: { url: string }) => {
  const texture = useLoader(TextureLoader, url);
  return <primitive object={texture} dispose={null} attach="map" />;
};

export default observer((params: MaterialParameters) => {
  const missingTexture = useMemo(
    () => new TextureLoader().load(require("../../assets/missing-texture.png")),
    []
  );

  return (
    <meshStandardMaterial attachArray="material" {...(params as any)}>
      {params.textureUrl && (
        <Suspense fallback={<primitive object={missingTexture} attach="map" />}>
          <Texture url={params.textureUrl} />
        </Suspense>
      )}
    </meshStandardMaterial>
  );
});
