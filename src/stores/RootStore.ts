import React from "react";
import { observable } from "mobx";
import AppStore from "./AppStore";
import UIState from "./UIState";
import GameStore from "./GameStore";

export default class RootStore {
  appStore!: AppStore;
  gameStore!: GameStore;
  uiState!: UIState;
  @observable isInitialized = false;

  async init() {
    this.appStore = new AppStore(this);
    this.gameStore = new GameStore(this);
    this.uiState = new UIState(this);

    await Promise.all([
      this.appStore.init(),
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
