import { ExtendedModel, model, prop, modelAction } from "mobx-keystone";
import React from "react";
import HandAreaComponent, {
  HandAreaProps
} from "../../components/game/entities/HandArea";
import Entity, { EntityType } from "./Entity";
import { computed } from "mobx";
import Player from "../Player";

@model("HandArea")
export default class HandArea extends ExtendedModel(Entity, {
  playerId: prop("", { setterAction: true }),
  isHidden: prop(true, { setterAction: true })
}) {
  onInit() {
    super.onInit();
    this.type = EntityType.HandArea;
    this.stackable = false;
    this.editable = false;
  }

  @computed get player() {
    return this.gameState?.players.find(p => p.userId === this.playerId);
  }

  @computed get claimed(): boolean {
    return this.player !== undefined && this.player.isConnected;
  }

  @modelAction
  claim(player: Player) {
    this.playerId = player.userId;
  }

  @modelAction
  toggleHidden() {
    this.isHidden = !this.isHidden;
  }

  render(props: HandAreaProps): JSX.Element {
    return React.createElement(HandAreaComponent, props);
  }
}
