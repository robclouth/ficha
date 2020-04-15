import React from "react";
import { observable } from "mobx";
import AssetStore from "./AssetStore";
import UIState from "./UIState";
import GameStore from "./GameStore";

export default class RootStore {
  assetStore!: AssetStore;
  gameStore!: GameStore;
  uiState!: UIState;
  @observable isInitialized = false;

  async init() {
    this.assetStore = new AssetStore(this);
    this.gameStore = new GameStore(this);
    this.uiState = new UIState(this);

    await Promise.all([
      this.assetStore.init(),
      this.gameStore.init(),
      this.uiState.init()
    ]);
    this.isInitialized = true;
  }
}

const context = React.createContext<RootStore>(new RootStore());

export const useStore = () => {
  return React.useContext(context);
};
