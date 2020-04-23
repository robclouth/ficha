import { ExtendedModel, model } from "mobx-keystone";
import React from "react";
import DeckComponent, { DeckProps } from "../../components/game/entities/Deck";
import { EntityType } from "./Entity";
import EntitySet from "./EntitySet";

@model("Deck")
export default class Deck extends ExtendedModel(EntitySet, {}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Deck;
    this.childType = EntityType.Card;
    this.stackable = false;
  }

  render(props: DeckProps): JSX.Element {
    return React.createElement(DeckComponent, props);
  }
}
