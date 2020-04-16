import { observable } from "mobx";
import Entity, { EntityType } from "./Entity";
import { Model, model, modelAction, prop, ExtendedModel } from "mobx-keystone";

@model("Card")
export default class Card extends ExtendedModel(Entity, {
  faceUp: prop(false, { setterAction: true }),
  frontImageUrl: prop<string>("", { setterAction: true }),
  backImageUrl: prop<string>("", { setterAction: true })
}) {
  onInit() {
    this.type = EntityType.Card;
  }

  @modelAction
  flip() {
    this.faceUp = !this.faceUp;
  }
}
