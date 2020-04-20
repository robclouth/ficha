import { computed } from "mobx";
import {
  clone,
  detach,
  ExtendedModel,
  model,
  modelAction,
  prop,
  rootRef
} from "mobx-keystone";
import Card from "./Card";
import Entity, { EntityType } from "./Entity";

export const deckRef = rootRef<Deck>("DeckRef", {
  onResolvedValueChange(ref, newDeck, oldDeck) {
    if (oldDeck && !newDeck) detach(ref);
  }
});

@model("Deck")
export default class Deck extends ExtendedModel(Entity, {
  cards: prop<Card[]>(() => [], { setterAction: true })
}) {
  onInit() {
    this.type = EntityType.Deck;

    // claim ownership of all the cards
    this.cards.forEach(card => (card.ownerDeck = deckRef(this)));
  }

  @computed get looseCards() {
    if (!this.gameState) return [];
    return this.gameState.entities.filter(
      entity =>
        entity.type === EntityType.Card &&
        (entity as Card).ownerDeck?.current === this
    ) as Card[];
  }

  @computed get allCards() {
    return [...this.cards, ...this.looseCards];
  }

  @modelAction
  addCard(card: Card) {
    this.cards.unshift(card);
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
    const card = this.cards[this.faceUp ? 0 : this.cards.length - 1];
    this.removeCard(card);
    card.position[0] = this.position[0];
    card.position[1] = this.position[1];
    card.faceUp = this.faceUp;
    this.gameState.addEntity(card);
    return card;
  }

  @modelAction
  reset() {
    this.looseCards.forEach(card => {
      this.gameState.removeEntity(card);
      this.addCard(card);
      card.faceUp = this.faceUp;
    });
  }
}
