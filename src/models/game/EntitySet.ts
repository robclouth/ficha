import { take as take_ } from "lodash";
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
import { Vector3 } from "../../types";
import Entity, { entityRef, EntityType } from "./Entity";

export const entitySetRef = rootRef<EntitySet>("EntitySetRef", {
  onResolvedValueChange(ref, newSet, oldSet) {
    if (oldSet && !newSet) detach(ref);
  }
});

export type DealPosition = {
  position: Vector3;
  angle: number;
  faceUp: boolean;
};

@model("EntitySet")
export default class EntitySet extends ExtendedModel(Entity, {
  childType: prop<EntityType>(EntityType.Any, { setterAction: true }),
  containedEntities: prop<Entity[]>(() => [], { setterAction: true }),
  prototypes: prop<Entity[]>(() => [], { setterAction: true }),
  prototypeCounts: prop<{ [key: string]: number }>(() => ({})),
  infinite: prop(false, { setterAction: true }),
  savedDeal: prop<DealPosition[] | undefined>(undefined, { setterAction: true })
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
    prototype.isPrototype = true;
    this.prototypes.push(prototype);
    this.setPrototypeCount(prototype, 1);
    this.addEntity(this.instantiateFromPrototype(prototype));
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
    entity.isPrototype = false;
    return entity;
  }

  @modelAction
  addEntity(entity: Entity) {
    this.containedEntities.push(entity);
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
  take(count: number) {
    let entities: Entity[] = [];
    if (this.infinite) {
      for (let i = 0; i < count; i++)
        entities.push(
          this.instantiateFromPrototype(
            this.prototypesWithDuplicates[
              Math.floor(Math.random() * this.prototypesWithDuplicates.length)
            ]
          )
        );
    } else {
      let list = [...this.containedEntities];
      if (!this.faceUp) list.reverse();

      entities = take_(list, count);
      entities.forEach(entity => {
        this.removeEntity(entity);
        entity.position = { ...this.position };
        this.gameState.addEntity(entity);
      });
    }

    return entities;
  }

  @modelAction
  drawOne() {
    if (this.containedEntities.length > 0) {
      const card = this.take(1)[0];
      card.position.x += 1;
    }
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
  saveDeal() {
    this.savedDeal = this.externalEntities.map(entity => ({
      position: { ...entity.position },
      angle: entity.angle,
      faceUp: entity.faceUp
    }));
  }

  @modelAction
  deal() {
    if (this.savedDeal) {
      this.savedDeal.forEach(dealPosition => {
        const entity = this.take(1);
        if (entity.length > 0) {
          entity[0].position = { ...dealPosition.position };
          entity[0].angle = dealPosition.angle;
          entity[0].faceUp = dealPosition.faceUp;
        }
      });
    }
  }

  @modelAction
  reset() {
    this.externalEntities.forEach(entity => {
      this.gameState.removeEntity(entity);
    });

    this.containedEntities = [];
    this.prototypesWithDuplicates.forEach(prototype => {
      const entity = this.instantiateFromPrototype(prototype);
      entity.faceUp = this.faceUp;
      this.addEntity(entity);
    });

    this.shuffle();
  }

  @modelAction
  refill() {
    this.prototypes.forEach(prototype => {
      const count = this.prototypeCounts[prototype.$modelId];
      const instanceCount = this.allEntities.filter(
        entity => entity.prototype?.maybeCurrent === prototype
      ).length;
      let amountNeeded = count - instanceCount;

      // card deficit - need to add new cards to the deck
      if (amountNeeded >= 0) {
        for (let i = 0; i < amountNeeded; i++) {
          const entity = this.instantiateFromPrototype(prototype);
          entity.faceUp = this.faceUp;
          this.addEntity(entity);
        }
      } else {
        // card excess - remove cards first from cards in the deck, then from placed cards
        amountNeeded *= -1;
        const max = Math.min(amountNeeded, this.allEntities.length);
        const containedCount = this.containedEntities.length;
        for (let i = 0; i < max; i++) {
          const entity = this.allEntities[i];
          if (i < containedCount) this.removeEntity(entity);
          else this.gameState.removeEntity(entity);
        }
      }
    });
  }

  @modelAction
  flip() {
    super.flip();
    this.containedEntities.forEach(entity => entity.flip());
  }

  @modelAction
  updateInstances() {
    this.allEntities.forEach(entity => entity.updateFromPrototype());
  }
}
