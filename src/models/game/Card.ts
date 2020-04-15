import { observable } from "mobx";
import Entity, { EntityType } from "./Entity";
import { Model, model, modelAction, prop, ExtendedModel } from "mobx-keystone";

const frontUrl =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Playing_card_heart_5.svg/1200px-Playing_card_heart_5.svg.png";
const backUrl =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQ-Pf2ukfeBiA59STcawv01t4ybkxyNrT50nNnycKD7XQNU3HkY&usqp=CAU";

@model("Card")
export default class Card extends ExtendedModel(Entity, {
  faceUp: prop(false, { setterAction: true }),
  frontImageUrl: prop<string>(frontUrl, { setterAction: true }),
  backImageUrl: prop<string>(backUrl, { setterAction: true })
}) {
  onInit() {
    this.type = EntityType.Card;
  }

  @modelAction
  flip() {
    this.faceUp = !this.faceUp;
    const temp = this.frontImageUrl;
    this.frontImageUrl = this.backImageUrl;
    this.backImageUrl = temp;
  }
}
