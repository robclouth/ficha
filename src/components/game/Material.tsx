import { observer } from "mobx-react";
import { TextureLoader, MeshStandardMaterialParameters } from "three";
import { useLoader } from "react-three-fiber";
import React, { Suspense, useMemo } from "react";
import { useStore } from "../../stores/RootStore";

export type MaterialParameters = MeshStandardMaterialParameters & {
  textureUrl?: string;
};

const absoluteUrlRegExp = new RegExp("^(?:[a-z]+:)?//", "i");

const Texture = observer(({ url }: { url: string }) => {
  const { gameStore } = useStore();
  const gameState = gameStore.gameState;

  if (!absoluteUrlRegExp.test(url)) {
    url = gameState.assetsUrl + "/" + url;
  }

  const texture = useLoader(TextureLoader, url);
  return <primitive object={texture} dispose={null} attach="map" />;
});

export default observer((params: MaterialParameters) => {
  const missingTexture = useMemo(
    () => new TextureLoader().load(require("../../assets/missing-texture.png")),
    []
  );

  // const { gameStore } = useStore();
  // const gameState = gameStore.gameState;

  // if (params.textureUrl) {
  //   if (relativeUrlRegExp.test(params.textureUrl))
  //     params.textureUrl = gameState.assetsUrl + "/" + params.textureUrl;
  // }

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
