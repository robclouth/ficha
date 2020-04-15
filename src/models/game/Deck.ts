import { ExtendedModel, model, prop, modelAction } from "mobx-keystone";
import Card from "./Card";
import Entity, { EntityType } from "./Entity";
//@ts-ignore
import shuffle from "shuffle-array";

@model("Deck")
export default class Deck extends ExtendedModel(Entity, {
  cards: prop<Card[]>(() => [], { setterAction: true })
}) {
  onInit() {
    this.type = EntityType.Deck;
  }

  @modelAction
  addCard(card: Card) {
    this.cards.push(card);
  }

  @modelAction
  removeCard(card: Card) {
    this.cards.splice(this.cards.indexOf(card), 1);
  }

  @modelAction
  shuffle() {
    shuffle(this.cards);
  }
}
