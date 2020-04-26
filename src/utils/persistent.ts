import { _await, getSnapshot, applySnapshot } from "mobx-keystone";
import localforage from "localforage";
import { reaction } from "mobx";

export default async function persist(target: any, propertyKey: string) {
  const targetJson = await localforage.getItem<any>(propertyKey);

  if (!targetJson) {
    await localforage.setItem(propertyKey, getSnapshot(target));
  } else {
    applySnapshot(target, { ...targetJson, $modelId: target.$modelId });
  }

  reaction(
    () => getSnapshot(target),
    snapshot => {
      localforage.setItem(propertyKey, snapshot);
    },
    { delay: 1000 }
  );

  return !!targetJson;
}
