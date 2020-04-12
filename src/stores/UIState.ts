import RootStore from "./RootStore";
import { observable, action } from "mobx";

export default class UIState {
  @observable isInitialized = false;

  constructor(private rootStore: RootStore) {}

  async init() {
    this.isInitialized = true;
  }
}
