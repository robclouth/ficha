import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Canvas,
  useFrame,
  extend,
  useThree,
  PointerEvent
} from "react-three-fiber";
import { observer } from "mobx-react";
import { useStore } from "../../stores/RootStore";
import { Mesh, Clock, Color } from "three";
import * as THREE from "three";
import CameraControls from "camera-controls";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import Card from "./entities/Card";
import Entity, { EntityType } from "../../models/game/Entity";
import Deck from "./entities/Deck";
import { EntityProps } from "./entities/Entity";
import { ContextMenuItem } from "../../types";

extend({ CameraControls, DragControls });
CameraControls.install({ THREE: THREE });

const CameraControl = observer(() => {
  const { gameStore, uiState } = useStore();

  const { gl, camera } = useThree();
  const cameraControlsRef = useRef<CameraControls>();
  const clock = useMemo(() => new Clock(), []);

  useFrame(state => {
    cameraControlsRef.current!.update(clock.getDelta());
  });

  return (
    <cameraControls
      enabled={!uiState.isDraggingEntity}
      ref={cameraControlsRef}
      args={[camera, gl.domElement]}
      draggingDampingFactor={0.1}
      verticalDragToForward={true}
      dollySpeed={0.2}
      maxPolarAngle={(Math.PI / 2) * 0.97}
      minDistance={2}
      maxDistance={30}
      mouseButtons={{
        left: CameraControls.ACTION.TRUCK,
        middle: CameraControls.ACTION.NONE,
        right: CameraControls.ACTION.ROTATE,
        wheel: CameraControls.ACTION.DOLLY
      }}
    />
  );
});

function renderEntity(props: Omit<EntityProps, "geometry">, index: number) {
  if (props.entity!.type === EntityType.Card)
    return <Card key={index} {...props} />;
  else if (props.entity!.type === EntityType.Deck)
    return <Deck key={index} {...props} />;
}

export type GameCanvasProps = {
  onContextMenu: (
    event: PointerEvent,
    menuItems: ContextMenuItem[] | null
  ) => void;
};

export default observer<React.FC<GameCanvasProps>>(({ onContextMenu }) => {
  const { gameStore, uiState } = useStore();
  const gameState = gameStore.gameState;

  const [startDragPos, setStartDragPos] = React.useState({ x: 0, y: 0 });

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button === 2) {
      setStartDragPos({
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (
      event.button === 2 &&
      Math.sqrt(
        Math.pow(event.clientX - startDragPos.x, 2) +
          Math.pow(event.clientY - startDragPos.y, 2)
      ) < 5
    ) {
      onContextMenu(event, null);
    }
  };

  return (
    <Canvas
      style={{ background: "#333333", position: "absolute" }}
      camera={{ position: [0, 5, 5] }}
    >
      <ambientLight args={["white", 0.4]} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {gameState?.entities.map((entity, i) =>
        renderEntity(
          {
            entity,
            onContextMenu
          },
          i
        )
      )}
      <gridHelper
        args={[50, 50]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
      <CameraControl />
    </Canvas>
  );
});
