import { ExtendedModel, model, modelAction, prop, Ref } from "mobx-keystone";
import Deck from "./Deck";
import Entity, { EntityType } from "./Entity";
import { when } from "mobx";
import { nanoid } from "nanoid";

@model("Card")
export default class Card extends ExtendedModel(Entity, {
  positionInDeck: prop<number>(-1, { setterAction: true }),
  frontImageUrl: prop<string>("", { setterAction: true }),
  backImageUrl: prop<string>("", { setterAction: true }),
  ownerDeck: prop<Ref<Deck> | undefined>(undefined, { setterAction: true }),
  title: prop("", { setterAction: true }),
  subtitle: prop("", { setterAction: true }),
  body: prop("", { setterAction: true }),
  value: prop("", { setterAction: true })
}) {
  onInit() {
    this.type = EntityType.Card;

    when(
      () => this.assetCache !== undefined,
      () => {
        this.assetCache!.addTexture(this.frontImageUrl);
        this.assetCache!.addTexture(this.backImageUrl);
      }
    );
  }

  @modelAction
  returnToDeck() {
    if (this.ownerDeck) {
      const deck = this.ownerDeck.current;
      this.gameState.removeEntity(this);
      deck.addCard(this);
      this.faceUp = deck.faceUp;
    }
  }

  @modelAction
  removeFromDeck() {
    this.ownerDeck = undefined;
  }
}
