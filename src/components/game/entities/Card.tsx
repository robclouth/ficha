import { observer } from "mobx-react";
import React, { useMemo } from "react";
import Card, { Shape } from "../../../models/game/Card";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import { ContextMenuItem } from "../../../types";
import { useStore } from "../../../stores/RootStore";
import defaultCardBack from "../../../assets/default-back.png";
import {
  Color,
  Group,
  CanvasTexture,
  BufferGeometry,
  Quaternion,
  Object3D
} from "three";
import { Dom } from "react-three-fiber";
import { range } from "lodash";

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
  const { entity } = props;
  const card = entity as Card;
  const {
    frontImageUrl,
    backImageUrl,
    ownerSet,
    color,
    title,
    subtitle,
    body,
    centerValue,
    cornerValue,
    shape
  } = card;

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Flip",
      type: "action",
      action: () => entity.flip()
    }
  ];

  if (ownerSet) {
    contextMenuItems.push({
      label: "Return to deck",
      type: "action",
      action: () => card.returnToSet()
    });
    // contextMenuItems.push({
    //   label: "Remove from deck",
    //   type: "action",
    //   action: () => card.removeFromSet()
    // });
  }

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

    if (title) {
      context.font = `${fontSize}px Roboto`;
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillText(title, padding, padding, canvas.width - padding * 2);
    }

    if (subtitle) {
      context.font = `${fontSize * 0.7}px Roboto`;
      context.textBaseline = "top";
      context.fillText(
        subtitle,
        padding,
        padding + fontSize,
        canvas.width - padding * 2
      );
    }

    if (cornerValue) {
      context.font = `${fontSize * 2}px Roboto`;
      context.textAlign = "right";
      context.textBaseline = "top";
      context.fillText(
        cornerValue,
        canvas.width - padding,
        padding,
        canvas.width - padding * 2
      );
    }

    if (centerValue) {
      context.font = `${fontSize * 4}px Roboto`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        centerValue,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width - padding * 2
      );
    }

    if (body) {
      context.font = `${fontSize * 0.5}px Roboto`;
      context.textAlign = "left";
      context.textBaseline = "top";
      wrapText(
        context,
        body,
        padding,
        canvas.height / 2,
        canvas.width - padding * 2,
        fontSize * 0.5
      );
    }

    return new CanvasTexture(canvas);
  }, [
    frontImageUrl,
    shape,
    title,
    subtitle,
    body,
    cornerValue,
    centerValue,
    JSON.stringify(color)
  ]);

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
    </Entity>
  );
});
