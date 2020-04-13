import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, extend, useThree } from "react-three-fiber";
import { observer } from "mobx-react";
import { useStore } from "../../stores/RootStore";
import { Mesh, Clock } from "three";
// import DragControls from "three/examples/js/controls/DragControls";
import CameraControls from "camera-controls";
extend({ CameraControls });

const Box = observer((props: { position: [number, number, number] }) => {
  // This reference will give us direct access to the mesh
  const { gl, camera } = useThree();
  const mesh = useRef<Mesh>();

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
      {/* <dragControls args={[[mesh], camera, gl.domElement]} /> */}
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
      <meshStandardMaterial
        attach="material"
        color={hovered ? "hotpink" : "orange"}
      />
    </mesh>
  );
});

const Scene = observer(() => {
  const { gameStore } = useStore();
  const { player, gameState } = gameStore;

  const { gl, camera } = useThree();
  const ref = useRef<CameraControls>();
  const clock = useMemo(() => new Clock(), []);

  useFrame(state => {
    ref.current!.update(clock.getDelta());
  });

  return (
    <>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {gameState.players.map(player => (
        <Box key={player.id} position={[player.wood, 0.5, 0]} />
      ))}
      <gridHelper args={[50, 50]} />
      <cameraControls
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
    <Canvas>
      <Scene />
    </Canvas>
  );
});
