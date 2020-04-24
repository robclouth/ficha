import { observable, computed } from "mobx";
import { model, Model, modelAction, getRootStore } from "mobx-keystone";
import { Texture, TextureLoader, Cache, RepeatWrapping } from "three";
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
    return url.startsWith("data:") || absoluteUrlRegExp.test(url)
      ? url
      : this.gameStore.gameState.assetsUrl + "/" + url;
  }

  @modelAction
  addTexture(url: string, makeAbsolute = true) {
    if (makeAbsolute) url = this.makeUrlAbsolute(url);

    if (!this.textureCache[url]) this.textureCache[url] = this.loadTexture(url);
  }

  @modelAction
  getTexture(url: string, makeAbsolute = true): Texture {
    if (makeAbsolute) url = this.makeUrlAbsolute(url);

    let texture = this.textureCache[url];

    if (texture) return texture;
    else {
      texture = this.loadTexture(url);
      this.textureCache[url] = texture;
      texture.wrapS = texture.wrapT = RepeatWrapping;
      return texture;
    }
  }

  loadTexture(url: string) {
    return new TextureLoader().setCrossOrigin("anonymous").load(url);
  }
}
