import { clone, ExtendedModel, model, modelAction, prop } from "mobx-keystone";
import Card from "./Card";
import Entity, { EntityType } from "./Entity";

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
    let currentIndex = this.cards.length,
      temporaryValue,
      randomIndex;

    const shuffledCards = [];
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      shuffledCards.push(clone(this.cards[randomIndex]));
    }

    this.cards = shuffledCards;
  }

  @modelAction
  takeCards(count: number) {
    const card = this.cards[this.cards.length - 1];
    this.removeCard(card);
    card.position[0] += 1;
    this.gameState.addEntity(card);
  }

  @modelAction
  reset() {
    const cards = this.gameState.entities.filter(
      entity =>
        entity.type === EntityType.Card &&
        (entity as Card).ownerDeckId === this.$modelId
    ) as Card[];
    cards.forEach(card => {
      this.gameState.removeEntity(card);
      this.addCard(card);
      card.faceUp = false;
    });
  }
}
