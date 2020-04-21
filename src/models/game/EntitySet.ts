import { computed, reaction, autorun } from "mobx";
import {
  clone,
  detach,
  ExtendedModel,
  model,
  modelAction,
  prop,
  rootRef,
  prop_mapObject,
  getSnapshot,
  applySnapshot,
  SnapshotOutOfModel
} from "mobx-keystone";
//@ts-ignore
import shuffleArray from "shuffle-array";
import Entity, { EntityType, entityRef } from "./Entity";

export const entitySetRef = rootRef<EntitySet>("EntitySetRef", {
  onResolvedValueChange(ref, newSet, oldSet) {
    if (oldSet && !newSet) detach(ref);
  }
});

@model("EntitySet")
export default class EntitySet extends ExtendedModel(Entity, {
  childType: prop<EntityType>(EntityType.Any, { setterAction: true }),
  containedEntities: prop<Entity[]>(() => [], { setterAction: true }),
  prototypes: prop<Entity[]>(() => [], { setterAction: true }),
  prototypeCounts: prop<{ [key: string]: number }>(() => ({})),

  infinite: prop(false, { setterAction: true })
}) {
  onInit() {
    super.onInit();
  }

  @computed get externalEntities() {
    if (!this.gameState) return [];
    return this.gameState.entities.filter(
      entity => entity.ownerSet?.maybeCurrent === this
    );
  }

  @computed get allEntities() {
    return [...this.containedEntities, ...this.externalEntities];
  }

  @computed get totalEntities() {
    return this.prototypesWithDuplicates.length;
  }

  @computed get prototypesWithDuplicates() {
    return this.prototypes.reduce((list, entity) => {
      const count = this.prototypeCounts[entity.$modelId] || 0;
      for (let i = 0; i < count; i++) list.push(entity);
      return list;
    }, [] as Entity[]);
  }

  getInstancesOfPrototype(prototype: Entity) {
    return this.allEntities.filter(
      entity => entity.prototype?.maybeCurrent === prototype
    );
  }

  getPrototypeCount(prototype: Entity) {
    return this.prototypeCounts[prototype.$modelId] || 0;
  }

  @modelAction
  setPrototypeCount(prototype: Entity, count: number) {
    this.prototypeCounts[prototype.$modelId] = count;
  }

  @modelAction
  addPrototype(prototype: Entity) {
    this.prototypes.unshift(prototype);
    this.setPrototypeCount(prototype, 1);
  }

  @modelAction
  removePrototype(prototype: Entity) {
    this.prototypes.splice(this.prototypes.indexOf(prototype), 1);
    delete this.prototypeCounts[prototype.$modelId];
    this.containedEntities
      .filter(entity => entity.prototype?.maybeCurrent === prototype)
      .forEach(entity => this.removeEntity(entity));
  }

  @modelAction
  instantiateFromPrototype(prototype: Entity) {
    const entity = clone(prototype);
    entity.prototype = entityRef(prototype);
    return entity;
  }

  @modelAction
  addEntity(entity: Entity) {
    this.containedEntities.unshift(entity);
  }

  @modelAction
  removeEntity(entity: Entity) {
    this.containedEntities.splice(this.containedEntities.indexOf(entity), 1);
  }

  @modelAction
  shuffle() {
    const shuffledEntities = this.containedEntities.map(entity =>
      clone(entity)
    );
    shuffleArray(shuffledEntities);
    this.containedEntities = shuffledEntities;
  }

  @modelAction
  shuffleAll() {
    this.shuffleEntities(this.allEntities);
  }

  @modelAction
  shuffleEntities(entities: Entity[]) {
    const shuffledEntities = entities.map(entity => clone(entity));
    shuffleArray(shuffledEntities);
    this.containedEntities = shuffledEntities;
    // for (let i = 0; i < shuffledEntities.length; i++) {
    //   const card = entities[i];
    //   this.swapEntities(card, shuffledEntities[i]);
    // }
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
    let entity: Entity;
    if (this.infinite) {
      entity = this.instantiateFromPrototype(
        this.prototypesWithDuplicates[
          Math.floor(Math.random() * this.prototypesWithDuplicates.length)
        ]
      );
    } else {
      if (this.totalEntities === 0) return undefined;

      entity = this.containedEntities[
        this.faceUp ? 0 : this.containedEntities.length - 1
      ];
      this.removeEntity(entity);
      entity.position = { ...this.position };
      entity.faceUp = this.faceUp;
      this.gameState.addEntity(entity);
    }

    return entity;
  }

  @modelAction
  takeRandom(count: number) {
    if (this.totalEntities === 0) return undefined;

    const entity = this.containedEntities[
      this.faceUp ? 0 : this.containedEntities.length - 1
    ];

    this.removeEntity(entity);
    entity.position = { ...this.position };

    entity.faceUp = this.faceUp;
    this.gameState.addEntity(entity);
    return entity;
  }

  @modelAction
  reset() {
    this.externalEntities.forEach(entity => {
      this.gameState.removeEntity(entity);
    });

    this.containedEntities = [];
    this.prototypesWithDuplicates.forEach(prototype =>
      this.addEntity(this.instantiateFromPrototype(prototype))
    );

    this.shuffle();
  }

  @modelAction
  updateInstances() {
    this.allEntities.forEach(entity => entity.updateFromPrototype());
  }
}
