import { observable, computed } from "mobx";
import Entity, { EntityType } from "./Entity";
import {
  Model,
  model,
  modelAction,
  prop,
  ExtendedModel,
  findParent,
  rootRef,
  detach
} from "mobx-keystone";
import Deck from "./Deck";

export const cardRef = rootRef<Card>("CardRef", {
  onResolvedValueChange(ref, newCard, oldCard) {
    if (oldCard && !newCard) {
      detach(ref);
    }
  }
});

@model("Card")
export default class Card extends ExtendedModel(Entity, {
  positionInDeck: prop<number>(-1, { setterAction: true }),
  frontImageUrl: prop<string>("", { setterAction: true }),
  backImageUrl: prop<string>("", { setterAction: true }),
  ownerDeckId: prop<string>("", { setterAction: true })
}) {
  onInit() {
    this.type = EntityType.Card;
  }

  @computed get ownerDeck() {
    return this.gameState.entities.find(
      entity =>
        entity.type === EntityType.Deck && entity.$modelId == this.ownerDeckId
    ) as Deck;
  }

  @modelAction
  returnToDeck() {
    if (this.ownerDeck) {
      this.gameState.removeEntity(this);
      this.ownerDeck.addCard(this);
      this.faceUp = this.ownerDeck.faceUp;
    }
  }
}
