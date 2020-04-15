import { observable } from "mobx";
import Asset from "./Asset";

export default class Deck extends Asset {
  @observable frontImageUrls: string[];
  @observable backImageUrl: string;

  constructor(json: any) {
    super(json);
    this.frontImageUrls = json.frontImages;
    this.backImageUrl = json.backImage;
  }
}
