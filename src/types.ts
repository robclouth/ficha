import Entity from "./models/game/Entity";

export type ContextMenuItem = {
  label: string;
  type: "action" | "divider" | "edit";
  target?: Entity;
  action?: () => void;
};
