import { observer } from "mobx-react";
import React, { useMemo } from "react";
import Card from "../../../models/game/Card";
import Entity, { EntityProps, MaterialParameters } from "./Entity";
import { ContextMenuItem } from "../../../types";
import { useStore } from "../../../stores/RootStore";
import defaultCardBack from "../../../assets/default-back.png";
import { Color, Group, CanvasTexture } from "three";
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
    cornerValue
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
    contextMenuItems.push({
      label: "Remove from deck",
      type: "action",
      action: () => card.removeFromSet()
    });
  }

  const edgeMaterialParams = {
    roughness: 1
    // color: "white"
  };
  const backTexture = backImageUrl
    ? assetCache.getTexture(backImageUrl)
    : assetCache.getTexture(defaultCardBack, false);

  const canvasTexture = useMemo(() => {
    if (!(title || subtitle || body || centerValue || cornerValue)) return null;
    const canvas = document.createElement("canvas");
    canvas.height = 2048;
    canvas.width = canvas.height * 0.7;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const fontSize = canvas.width * 0.15;
    context.font = `${fontSize}px Roboto`;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillStyle = "black";

    const padding = canvas.width * 0.05;
    context.fillText(title, padding, padding, canvas.width - padding * 2);

    context.font = `${fontSize * 0.7}px Roboto`;
    context.fillText(
      subtitle,
      padding,
      padding + fontSize,
      canvas.width - padding * 2
    );

    context.font = `${fontSize * 2}px Roboto`;
    context.textAlign = "right";
    context.fillText(
      cornerValue,
      canvas.width - padding,
      padding,
      canvas.width - padding * 2
    );
    context.textAlign = "left";

    context.font = `${fontSize * 4}px Roboto`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      centerValue,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width - padding * 2
    );
    context.textAlign = "left";
    context.textBaseline = "top";

    context.font = `${fontSize * 0.5}px Roboto`;
    wrapText(
      context,
      body,
      padding,
      canvas.height / 2,
      canvas.width - padding * 2,
      fontSize * 0.5
    );

    return new CanvasTexture(canvas);
  }, [title, subtitle, body, cornerValue, centerValue]);

  const materialParams: MaterialParameters[] = [
    edgeMaterialParams,
    edgeMaterialParams,
    {
      roughness: 0.2,
      map: backTexture
    },
    {
      roughness: 0.2,
      map:
        canvasTexture ||
        (frontImageUrl ? assetCache.getTexture(frontImageUrl) : undefined),
      color: new Color(color.r, color.g, color.b)
    },
    edgeMaterialParams,
    edgeMaterialParams
  ];

  return (
    <Entity
      {...props}
      pivot={[0, -cardHeight / 2, 0]}
      geometry={
        <boxBufferGeometry args={[0.7, cardHeight, 1]} attach="geometry" />
      }
      materialParams={materialParams}
      contextMenuItems={contextMenuItems}
      deletable={ownerSet ? false : true}
      doubleClickAction={() => card.flip()}
      castShadows={false}
    >
      {canvasTexture && <primitive object={canvasTexture} />}
    </Entity>
  );
});
