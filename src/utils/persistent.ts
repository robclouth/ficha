import { _await, getSnapshot } from "mobx-keystone";
import localforage from "localforage";
import { reaction } from "mobx";

export default async function persist(
  target: any,
  propertyKey: string,
  factory: () => any
) {
  const targetJson = await localforage.getItem<string>(propertyKey);
  if (!targetJson) {
    target = factory();
    await localforage.setItem(propertyKey, target);
  }

  reaction(
    () => getSnapshot(target),
    snapshot => {
      localforage.setItem(propertyKey, snapshot);
    },
    { delay: 1000 }
  );
}
