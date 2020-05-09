import { ExtendedModel, model, prop, modelAction } from "mobx-keystone";
import React from "react";
import CardComponent, { CardProps } from "../../components/game/entities/Card";
import Entity, { EntityType } from "./Entity";
import { computed } from "mobx";
import Deck from "./Deck";

export enum Shape {
  Card,
  Hex,
  Square,
  Round
}

@model("Card")
export default class Card extends ExtendedModel(Entity, {
  cornerTexts: prop("", { setterAction: true }),
  centerText: prop("", { setterAction: true }),
  cardShape: prop<Shape>(Shape.Card, { setterAction: true })
}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Card;
  }

  @computed get deck() {
    return this.ownerSet?.maybeCurrent as Deck;
  }

  @computed get shape() {
    return this.deck ? this.deck.shape : this.cardShape;
  }

  getScale() {
    return this.deck ? this.deck.scale : this.scale;
  }

  @modelAction
  removeFromSet() {
    this.setScaleX(this.ownerSet!.current.scale.x);
    this.setScaleZ(this.ownerSet!.current.scale.z);
    super.removeFromSet();
  }

  render(props: CardProps): JSX.Element {
    return React.createElement(CardComponent, props);
  }
}
