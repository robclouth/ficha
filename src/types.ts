import Entity from "./models/game/Entity";

export type ContextMenuItem = {
  label: string;
  type: "action" | "divider" | "edit";
  target?: Entity;
  action?: () => void;
};

export type Vector3 = { x: number; y: number; z: number };
