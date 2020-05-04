import { ExtendedModel, model, prop } from "mobx-keystone";
import React from "react";
import PieceComponent, {
  PieceProps
} from "../../components/game/entities/Piece";
import Entity, { EntityType } from "./Entity";

export enum Shape {
  Cube,
  Cylinder,
  Cone,
  Sphere,
  Ring,
  Tetrahedron,
  Octahedron,
  Dodecahedron
}

@model("Piece")
export default class Piece extends ExtendedModel(Entity, {
  shape: prop<Shape>(Shape.Cube, { setterAction: true }),
  shapeParam1: prop(3, { setterAction: true }),
  shapeParam2: prop(3, { setterAction: true })
}) {
  onInit() {
    super.onInit();
    this.type = EntityType.Piece;
  }

  render(props: PieceProps): JSX.Element {
    return React.createElement(PieceComponent, props);
  }
}
