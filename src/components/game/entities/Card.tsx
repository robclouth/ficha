import { range } from "lodash";
import { observer } from "mobx-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  Object3D,
  Quaternion
} from "three";
import defaultCardBack from "../../../assets/default-back.png";
import Card, { Shape } from "../../../models/game/Card";
import { useStore } from "../../../stores/RootStore";
import { ContextMenuItem } from "../../../types";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import { Dom } from "react-three-fiber";

export type CardProps = Omit<EntityProps, "geometry"> & {};

export const cardHeight = 0.005;

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  let words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + " ";
    let metrics = context.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

export default observer((props: CardProps) => {
  const { assetCache } = useStore();
  const { t } = useTranslation();

  const { entity } = props;
  const card = entity as Card;
  const {
    frontImageUrl,
    backImageUrl,
    ownerSet,
    color,
    cornerTexts,
    centerText,
    shape,
    gameState,
    faceUp
  } = card;

  const contextMenuItems: Array<ContextMenuItem | false> = [
    {
      label: t("contextMenu.flip"),
      type: "action",
      action: () => entity.flip()
    },
    ownerSet !== undefined && {
      label: t("contextMenu.returnToDeck"),
      type: "action",
      action: () => card.returnToSet()
    },
    ownerSet !== undefined &&
      !gameState?.locked && {
        label: t("contextMenu.removeFromDeck"),
        type: "action",
        action: () => card.removeFromSet()
      }
  ];

  const backTexture = backImageUrl
    ? assetCache.getTexture(backImageUrl)
    : assetCache.getTexture(defaultCardBack, false);

  const canvasTexture = useMemo(() => {
    if (frontImageUrl) return null;
    const canvas = document.createElement("canvas");
    canvas.height = 2048;
    canvas.width = canvas.height * (shape === Shape.Card ? 0.7 : 1);
    const context = canvas.getContext("2d")!;
    context.fillStyle =
      "#" + new Color(color.r, color.g, color.b).getHexString();
    context.fillRect(0, 0, canvas.width, canvas.height);

    const fontSize = canvas.width * 0.15;
    const padding = canvas.width * 0.05;

    context.fillStyle = "black";

    if (cornerTexts) {
      const texts = cornerTexts.split(",");
      context.font = `${fontSize}px Roboto`;
      const positions = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ];
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i].trim();
        const position = positions[i];
        context.textAlign = position[0] === 0 ? "left" : "right";
        context.textBaseline = position[1] === 0 ? "top" : "bottom";

        context.fillText(
          text,
          position[0] === 0 ? padding : canvas.width - padding,
          position[1] === 0 ? padding : canvas.height - padding,
          canvas.width - padding * 2
        );
      }
    }

    if (centerText) {
      context.font = `${fontSize * 4}px Roboto`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        centerText,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width - padding * 2
      );
    }

    return new CanvasTexture(canvas);
  }, [frontImageUrl, shape, cornerTexts, centerText, JSON.stringify(color)]);

  const edgeMaterial: MaterialParameters = {
    roughness: 1,
    color: new Color(1, 1, 1)
  };

  const backMaterial: MaterialParameters = {
    roughness: 0.2,
    map: backTexture
  };

  const frontMaterial: MaterialParameters = {
    roughness: 0.2,
    map:
      canvasTexture ||
      (frontImageUrl ? assetCache.getTexture(frontImageUrl) : undefined),
    color: frontImageUrl
      ? new Color(color.r, color.g, color.b)
      : new Color(1, 1, 1)
  };

  let materialParams: MaterialParameters[];
  let rotationOffset = new Quaternion();

  let geometry: React.ReactElement<BufferGeometry>;
  if (shape === Shape.Card) {
    geometry = (
      <boxBufferGeometry args={[0.7, cardHeight, 1]} attach="geometry" />
    );

    materialParams = range(6).map(i => edgeMaterial);
    materialParams[2] = backMaterial;
    materialParams[3] = frontMaterial;
  } else if (shape === Shape.Hex) {
    geometry = (
      <cylinderBufferGeometry
        args={[0.5, 0.5, cardHeight, 6]}
        attach="geometry"
      />
    );
    materialParams = range(3).map(i => edgeMaterial);
    materialParams[1] = backMaterial;
    materialParams[2] = frontMaterial;
    materialParams.forEach(material => (material.flatShading = true));
    rotationOffset.setFromAxisAngle(Object3D.DefaultUp, Math.PI / 2);
  } else if (shape === Shape.Square) {
    geometry = (
      <boxBufferGeometry args={[1, cardHeight, 1]} attach="geometry" />
    );

    materialParams = range(6).map(i => edgeMaterial);
    materialParams[2] = backMaterial;
    materialParams[3] = frontMaterial;
  } else {
    geometry = (
      <cylinderBufferGeometry
        args={[0.5, 0.5, cardHeight, 30]}
        attach="geometry"
      />
    );

    materialParams = range(3).map(i => edgeMaterial);
    materialParams[1] = backMaterial;
    materialParams[2] = frontMaterial;
    rotationOffset.setFromAxisAngle(Object3D.DefaultUp, Math.PI / 2);
  }

  return (
    <Entity
      {...props}
      pivot={[0, -cardHeight / 2, 0]}
      geometry={geometry}
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      doubleClickAction={() => card.flip()}
      rotationOffset={rotationOffset}
      castShadows={false}
    >
      {canvasTexture && <primitive object={canvasTexture} />}
      {/* {faceUp && (
        <Dom
          position={[0, 1, 0]}
          center
          style={{ pointerEvents: "none", userSelect: "none" }}
          onContextMenu={() => false}
        >
          <img
            style={{
              width: 200 * (shape === Shape.Card ? 0.7 : 1),
              height: 200
            }}
            src={
              frontImageUrl
                ? frontImageUrl
                : (canvasTexture!.image as HTMLCanvasElement).toDataURL()
            }
          />
        </Dom>
      )} */}
    </Entity>
  );
});
