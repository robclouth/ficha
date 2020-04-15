import { observable } from "mobx";

export default class Asset {
  @observable name: string;
  @observable type: string;

  constructor(json: any) {
    this.name = json.name;
    this.type = json.type;
  }
}
