import { ExtendedModel, model, prop } from "mobx-keystone";
import React from "react";
import DeckComponent, { DeckProps } from "../../components/game/entities/Deck";
import { EntityType } from "./Entity";
import EntitySet from "./EntitySet";
import { Shape } from "./Card";

@model("Deck")
export default class Deck extends ExtendedModel(EntitySet, {
  shape: prop<Shape>(Shape.Card, { setterAction: true })
}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Deck;
    this.childType = EntityType.Card;
  }

  render(props: DeckProps): JSX.Element {
    return React.createElement(DeckComponent, props);
  }
}
