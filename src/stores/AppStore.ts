import { observable, action } from "mobx";
import RootStore from "./RootStore";

export default class AppStore {
  @observable isInitialised = false;

  constructor(private rootStore: RootStore) {}

  @action init() {
    this.isInitialised = true;
  }
}
