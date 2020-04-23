import { ExtendedModel, model, prop } from "mobx-keystone";
import React from "react";
import CardComponent, { CardProps } from "../../components/game/entities/Card";
import Entity, { EntityType } from "./Entity";

export enum Shape {
  Card,
  Hex,
  Square,
  Round
}

@model("Card")
export default class Card extends ExtendedModel(Entity, {
  title: prop("", { setterAction: true }),
  subtitle: prop("", { setterAction: true }),
  body: prop("", { setterAction: true }),
  cornerValue: prop("", { setterAction: true }),
  centerValue: prop("", { setterAction: true }),
  shape: prop<Shape>(Shape.Card, { setterAction: true })
}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Card;
    this.stackable = true;
  }

  render(props: CardProps): JSX.Element {
    return React.createElement(CardComponent, props);
  }
}
