import { computed } from "mobx";
import {
  clone,
  detach,
  ExtendedModel,
  model,
  modelAction,
  prop,
  rootRef,
  applySnapshot,
  getSnapshot,
  SnapshotInOf
} from "mobx-keystone";
import Card from "./Card";
import Entity, { EntityType } from "./Entity";
//@ts-ignore
import shuffleArray from "shuffle-array";

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
        (entity as Card).ownerDeck?.maybeCurrent === this
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
    const shuffledCards = this.cards.map(card => clone(card));
    shuffleArray(shuffledCards);

    for (let i = 0; i < shuffledCards.length; i++) {
      const card = this.cards[i];
      const shuffledCard = shuffledCards[i];
      this.swapCards(card, shuffledCard);
    }
  }

  @modelAction
  shufflePlaced() {
    const shuffledCards = this.allCards.map(card => clone(card));
    shuffleArray(shuffledCards);

    for (let i = 0; i < shuffledCards.length; i++) {
      const card = this.allCards[i];
      const shuffledCard = shuffledCards[i];
      this.swapCards(card, shuffledCard);
    }
  }

  @modelAction
  swapCards(card1: Card, card2: Card) {
    card1.frontImageUrl = card2.frontImageUrl;
    card1.backImageUrl = card2.backImageUrl;
    card1.title = card2.title;
    card1.subtitle = card2.subtitle;
    card1.body = card2.body;
    card1.value = card2.value;
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
