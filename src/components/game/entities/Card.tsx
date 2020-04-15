import { observer } from "mobx-react";
import React from "react";
import Card from "../../../models/game/Card";
import Entity, { EntityProps } from "./Entity";

export type CardProps = Omit<EntityProps, "geometry"> & {};

export const cardHeight = 0.05;

export default observer((props: CardProps) => {
  const { entity } = props;
  const { frontImageUrl, backImageUrl } = entity as Card;

  return (
    <Entity
      {...props}
      pivot={[0, -cardHeight / 2, 0]}
      geometry={
        <boxBufferGeometry args={[0.7, cardHeight, 1]} attach="geometry" />
      }
      materialParams={[
        {
          roughness: 0.2
        }
      ]}
    />
  );
});
