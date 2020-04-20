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
//@ts-ignore
import shuffleArray from "shuffle-array";
import Entity, { EntityType } from "./Entity";

export const entitySetRef = rootRef<EntitySet>("EntitySetRef", {
  onResolvedValueChange(ref, newSet, oldSet) {
    if (oldSet && !newSet) detach(ref);
  }
});

@model("EntitySet")
export default class EntitySet extends ExtendedModel(Entity, {
  entities: prop<Entity[]>(() => [], { setterAction: true }),
  childType: prop<EntityType>(EntityType.Any, { setterAction: true })
}) {
  onInit() {
    super.onInit();
    // claim ownership of all the cards
    this.entities.forEach(entity => (entity.ownerSet = entitySetRef(this)));
  }

  @computed get looseEntities() {
    if (!this.gameState) return [];
    return this.gameState.entities.filter(
      entity =>
        entity.type === this.type && entity.ownerSet?.maybeCurrent === this
    );
  }

  @computed get allEntities() {
    return [...this.entities, ...this.looseEntities];
  }

  @modelAction
  addEntity(entity: Entity) {
    this.entities.unshift(entity);
  }

  @modelAction
  removeEntity(entity: Entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
  }

  @modelAction
  shuffle() {
    this.shuffleEntities(this.entities);
  }

  @modelAction
  shuffleAll() {
    this.shuffleEntities(this.allEntities);
  }

  @modelAction
  shuffleEntities(entities: Entity[]) {
    const shuffledEntities = entities.map(entity => clone(entity));
    shuffleArray(shuffledEntities);

    for (let i = 0; i < shuffledEntities.length; i++) {
      const card = entities[i];
      this.swapEntities(card, shuffledEntities[i]);
    }
  }

  @modelAction
  swapEntities(entity1: Entity, entity2: Entity) {
    // card1.frontImageUrl = card2.frontImageUrl;
    // card1.backImageUrl = card2.backImageUrl;
    // card1.title = card2.title;
    // card1.subtitle = card2.subtitle;
    // card1.body = card2.body;
    // card1.value = card2.value;
  }

  @modelAction
  take(count: number) {
    const entity = this.entities[this.faceUp ? 0 : this.entities.length - 1];
    this.removeEntity(entity);
    entity.position[0] = this.position[0];
    entity.position[1] = this.position[1];
    entity.faceUp = this.faceUp;
    this.gameState.addEntity(entity);
    return entity;
  }

  @modelAction
  reset() {
    this.looseEntities.forEach(entity => {
      this.gameState.removeEntity(entity);
      this.addEntity(entity);
      entity.faceUp = this.faceUp;
    });
  }
}
