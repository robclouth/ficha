import CameraControls from "camera-controls";
import { observer } from "mobx-react";
import React, { useMemo, useRef } from "react";
import {
  Canvas,
  extend,
  PointerEvent,
  useFrame,
  useThree
} from "react-three-fiber";
import * as THREE from "three";
import { Clock } from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { EntityType } from "../../models/game/Entity";
import { useStore } from "../../stores/RootStore";
import Card from "./entities/Card";
import Deck from "./entities/Deck";
import { EntityProps } from "./entities/Entity";

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

export type GameCanvasProps = {};

export default observer<React.FC<GameCanvasProps>>(() => {
  const { gameStore, uiState } = useStore();
  const { openContextMenu } = uiState;

  const gameState = gameStore.gameState;

  const [startDragPos, setStartDragPos] = React.useState({ x: 0, y: 0 });

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button === 2) {
      setStartDragPos({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (
      e.button === 2 &&
      Math.sqrt(
        Math.pow(e.clientX - startDragPos.x, 2) +
          Math.pow(e.clientY - startDragPos.y, 2)
      ) < 5
    ) {
      uiState.openContextMenu(e);
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
            entity
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
