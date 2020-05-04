import Entity from "./models/game/Entity";

export type ContextMenuItem = {
  label: string;
  type: "action" | "divider" | "edit";
  target?: Entity;
  action?: () => void;
  params?: any;
};

export type Vector3 = { x: number; y: number; z: number };
