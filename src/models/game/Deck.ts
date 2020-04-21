import React from "react";
import { ExtendedModel, model, prop } from "mobx-keystone";
import { EntityType } from "./Entity";
import EntitySet from "./EntitySet";
import { computed } from "mobx";
import Card from "./Card";
import DeckComponent, { DeckProps } from "../../components/game/entities/Deck";

@model("Deck")
export default class Deck extends ExtendedModel(EntitySet, {}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Deck;
    this.childType = EntityType.Card;
  }

  @computed get cards() {
    return this.containedEntities as Card[];
  }

  @computed get allCards() {
    return this.allEntities as Card[];
  }

  render(props: DeckProps): JSX.Element {
    return React.createElement(DeckComponent, props);
  }
}
