import { observable } from "mobx";
import Entity, { EntityType } from "./Entity";

export default class Card extends Entity {
  @observable faceUp?: boolean;
  @observable faceImageUrl?: string;
  @observable backImageUrl?: string;

  constructor() {
    super(EntityType.Card);
  }
}
