import { observable } from "mobx";

export enum EntityType {
  Card
}

export default class Entity {
  @observable position?: [number, number];
  @observable pivot?: [number, number, number];
  @observable angle?: number;
  @observable scale?: number;
  @observable color?: [number, number, number];

  constructor(public type: EntityType) {}
}
