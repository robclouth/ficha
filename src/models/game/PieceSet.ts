import { computed } from "mobx";
import { ExtendedModel, model } from "mobx-keystone";
import { EntityType } from "./Entity";
import EntitySet from "./EntitySet";
import Piece from "./Piece";

@model("PieceSet")
export default class PieceSet extends ExtendedModel(EntitySet, {}) {
  onInit() {
    super.onInit();
    this.type = EntityType.PieceSet;
    this.childType = EntityType.Piece;
  }

  @computed get pieces() {
    return this.entities as Piece[];
  }

  @computed get allPieces() {
    return this.allEntities as Piece[];
  }
}