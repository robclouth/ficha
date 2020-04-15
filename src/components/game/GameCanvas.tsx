import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree } from "react-three-fiber";
import { observer } from "mobx-react";
import { useStore } from "../../stores/RootStore";
import { Mesh, Clock, Vector3 } from "three";
import * as THREE from "three";
import CameraControls from "camera-controls";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import Card from "./entities/Card";
import Entity, { EntityType } from "../../models/game/Entity";

extend({ CameraControls, DragControls });
CameraControls.install({ THREE: THREE });

const Box = observer((props: { position: [number, number, number] }) => {
  const { gl, camera } = useThree();

  const mesh = useRef<Mesh>();
  const dragControl = useRef<DragControls>();

  useEffect(() => {
    dragControl.current!.addEventListener("dragstart", function(event) {
      event.object.material.emissive.set(0xaaaaaa);
    });

    dragControl.current!.addEventListener("dragend", function(event) {
      event.object.material.emissive.set(0x000000);
    });
  }, []);

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      onClick={e => setActive(!active)}
      onPointerOver={e => setHover(true)}
      onPointerOut={e => setHover(false)}
    >
      <dragControls
        ref={dragControl}
        args={[[mesh.current], camera, gl.domElement]}
      />
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
      <meshStandardMaterial
        attach="material"
        color={hovered ? "hotpink" : "orange"}
      />
    </mesh>
  );
});

function renderEntity(entity: Entity) {
  if (entity.type === EntityType.Card) return <Card entity={entity} />;
}

const Scene = observer(() => {
  const { gameStore, uiState } = useStore();
  const { player, gameState } = gameStore;

  const { gl, camera } = useThree();
  const ref = useRef<CameraControls>();
  const clock = useMemo(() => new Clock(), []);

  useFrame(state => {
    ref.current!.update(clock.getDelta());
  });

  return (
    <>
      <ambientLight args={["white", 0.4]} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {gameState.entities.map(entity => renderEntity(entity))}
      {/* <Card
        faceUp
        frontImageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Playing_card_heart_5.svg/1200px-Playing_card_heart_5.svg.png"
        backImageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQ-Pf2ukfeBiA59STcawv01t4ybkxyNrT50nNnycKD7XQNU3HkY&usqp=CAU"
      /> */}
      <gridHelper args={[50, 50]} />
      <cameraControls
        enabled={!uiState.isDraggingEntity}
        ref={ref}
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
    </>
  );
});

export default observer(() => {
  const { gameStore } = useStore();
  const gameState = gameStore.gameState;

  return (
    <Canvas
      style={{ background: "#333333", position: "absolute" }}
      camera={{ position: [0, 5, 5] }}
    >
      <Scene />
    </Canvas>
  );
});
