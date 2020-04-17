import { observable, computed } from "mobx";
import Entity, { EntityType } from "./Entity";
import {
  Model,
  model,
  modelAction,
  prop,
  ExtendedModel,
  findParent
} from "mobx-keystone";

@model("Card")
export default class Card extends ExtendedModel(Entity, {
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
    );
  }
}
