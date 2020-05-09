import { observable, computed } from "mobx";
import { model, Model, modelAction, getRootStore } from "mobx-keystone";
import {
  Texture,
  TextureLoader,
  Cache,
  RepeatWrapping,
  CanvasTexture,
  Color
} from "three";
import RootStore from "./RootStore";
import Card, { Shape } from "../models/game/Card";

const absoluteUrlRegExp = new RegExp("^(?:[a-z]+:)?//", "i");

@model("AssetCache")
export default class AssetCache extends Model({}) {
  textureCache: { [k: string]: Texture } = {};
  imageCache: { [k: string]: HTMLImageElement } = {};

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

  drawCanvas(card: Card, texture: CanvasTexture) {
    const { frontImageUrl, shape, color, cornerTexts, centerText } = card;

    const canvas = texture.image as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;

    if (frontImageUrl) {
      let img: HTMLImageElement;
      if (this.imageCache[frontImageUrl]) {
        img = this.imageCache[frontImageUrl];
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        img = document.createElement("img");
        this.imageCache[frontImageUrl] = img;
        img.setAttribute("crossOrigin", "Anonymous");
        img.setAttribute("src", frontImageUrl);
        img.onload = () => {
          this.drawCanvas(card, texture);
        };
      }
    } else {
      context.fillStyle =
        "#" + new Color(color.r, color.g, color.b).getHexString();
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const fontSize = canvas.width * 0.15;
    const padding = canvas.width * 0.05;

    context.fillStyle = "black";

    if (cornerTexts) {
      const texts = cornerTexts.split(",");
      context.font = `${fontSize}px Roboto`;
      const positions = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ];
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i].trim();
        const position = positions[i];
        context.textAlign = position[0] === 0 ? "left" : "right";
        context.textBaseline = position[1] === 0 ? "top" : "bottom";

        context.fillText(
          text,
          position[0] === 0 ? padding : canvas.width - padding,
          position[1] === 0 ? padding : canvas.height - padding,
          canvas.width - padding * 2
        );
      }
    }

    if (centerText) {
      context.font = `${fontSize * 4}px Roboto`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        centerText,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width - padding * 2
      );
    }
    texture.needsUpdate = true;
  }

  getCardTexture(card: Card): Texture {
    const { frontImageUrl, shape, color, cornerTexts, centerText } = card;

    const key =
      (frontImageUrl || "none") +
      shape +
      (color.r.toString() + color.g.toString() + color.b.toString()) +
      (cornerTexts || "none") +
      (centerText || "none");

    let texture = this.textureCache[key];

    if (texture) return texture;
    else {
      const canvas = document.createElement("canvas");
      canvas.height = 2048;
      canvas.width = canvas.height * (shape === Shape.Card ? 0.7 : 1);

      const texture = new CanvasTexture(canvas);
      texture.anisotropy = 16;
      this.addToTextureCache(key, texture);

      this.drawCanvas(card, texture);

      return texture;
    }
  }

  getTexture(url: string, makeAbsolute = true): Texture {
    if (makeAbsolute) url = this.makeUrlAbsolute(url);

    let texture = this.textureCache[url];

    if (texture) return texture;
    else {
      texture = this.loadTexture(url);
      this.addToTextureCache(url, texture);
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.anisotropy = 16;
      return texture;
    }
  }

  @modelAction
  addToTextureCache(key: string, texture: Texture) {
    this.textureCache[key] = texture;
  }

  loadTexture(url: string) {
    return new TextureLoader().setCrossOrigin("Anonymous").load(url);
  }
}
