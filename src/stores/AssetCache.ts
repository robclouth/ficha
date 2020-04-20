import { observable, computed } from "mobx";
import { model, Model, modelAction, getRootStore } from "mobx-keystone";
import { Texture, TextureLoader, Cache } from "three";
import RootStore from "./RootStore";

const absoluteUrlRegExp = new RegExp("^(?:[a-z]+:)?//", "i");

@model("AssetCache")
export default class AssetCache extends Model({}) {
  textureCache: { [k: string]: Texture } = {};

  onInit() {
    Cache.enabled = true;
  }

  @computed get gameStore() {
    return getRootStore<RootStore>(this)?.gameStore!;
  }

  makeUrlAbsolute(url: string) {
    return absoluteUrlRegExp.test(url)
      ? url
      : this.gameStore.gameState.assetsUrl + "/" + url;
  }

  @modelAction
  addTexture(url: string) {
    url = this.makeUrlAbsolute(url);

    if (!this.textureCache[url])
      this.textureCache[url] = new TextureLoader().load(url);
  }

  @modelAction
  getTexture(url: string): Texture {
    url = this.makeUrlAbsolute(url);

    let texture = this.textureCache[url];

    if (texture) return texture;
    else {
      texture = new TextureLoader().load(url);
      this.textureCache[url] = texture;
      return texture;
    }
  }
}
