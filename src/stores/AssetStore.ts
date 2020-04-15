import { observable, action } from "mobx";
import RootStore from "./RootStore";
import Asset from "../models/assets/Asset";
import Deck from "../models/assets/Deck";

export default class AssetStore {
  @observable isInitialised = false;
  @observable assets: Asset[] = [];

  constructor(private rootStore: RootStore) {}

  @action init() {
    this.isInitialised = true;

    this.loadAssets();
  }

  @action loadAssets() {
    const assetJson = require("../assets/deck1/asset.json");

    if (assetJson.type === "deck") this.assets.push(new Deck(assetJson));
    else throw new Error("Unknown asset type: " + assetJson.type);
  }
}
