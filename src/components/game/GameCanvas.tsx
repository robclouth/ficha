import CameraControls from "camera-controls";
import { observer } from "mobx-react";
import React, { useMemo, useRef, useEffect } from "react";
import {
  Canvas,
  extend,
  PointerEvent,
  useFrame,
  useThree
} from "react-three-fiber";
import * as THREE from "three";
import {
  Clock,
  Vector3,
  Plane,
  Color,
  WebGLRenderer,
  Vector2,
  MeshStandardMaterial
} from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import Entity, { EntityType } from "../../models/game/Entity";
import { useStore } from "../../stores/RootStore";
import Card from "./entities/Card";
import Deck from "./entities/Deck";
import { EntityProps } from "./entities/Entity";
import { withoutUndo } from "mobx-keystone";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { SelectionBox } from "three/examples/jsm/interactive/SelectionBox";
import { SelectionHelper } from "three/examples/jsm/interactive/SelectionHelper";

extend({
  CameraControls,
  DragControls,
  EffectComposer,
  RenderPass,
  OutlinePass,
  ShaderPass,
  FXAAShader
});
CameraControls.install({ THREE: THREE });

const Outline = observer(() => {
  const { uiState } = useStore();

  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer>();
  useEffect(() => void composer.current?.setSize(size.width, size.height), [
    size
  ]);
  useFrame(() => composer.current?.render(), 1);

  const fxaaShaderPass = useRef<ShaderPass>();

  useEffect(() => {
    const uniforms = fxaaShaderPass.current?.uniforms as any;
    uniforms["resolution"].value.set(1 / size.width, 1 / size.height);
  }, [size]);

  const outlinePass = useMemo(
    () => new OutlinePass(new Vector2(size.width, size.height), scene, camera),
    []
  );

  outlinePass.selectedObjects = Object.values(uiState.selectedEntities)
    .filter(e => e.mesh)
    .map(e => e.mesh!);

  if (uiState.hoveredEntity?.mesh)
    outlinePass.selectedObjects.push(uiState.hoveredEntity.mesh);

  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" args={[scene, camera]} />
      <primitive attachArray="passes" object={outlinePass} />
      <shaderPass
        attachArray="passes"
        ref={fxaaShaderPass}
        args={[FXAAShader]}
        renderToScreen
      />
    </effectComposer>
  );
});

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
      enabled={uiState.canMoveCamera}
      ref={cameraControlsRef}
      args={[camera, gl.domElement]}
      draggingDampingFactor={0.1}
      verticalDragToForward={true}
      dollySpeed={0.2}
      maxPolarAngle={(Math.PI / 2) * 0.97}
      minDistance={2}
      maxDistance={30}
      mouseButtons={{
        left: CameraControls.ACTION.NONE,
        middle: CameraControls.ACTION.ROTATE,
        right: CameraControls.ACTION.TRUCK,
        wheel: CameraControls.ACTION.DOLLY
      }}
    />
  );
});

const Selection = observer(() => {
  const { scene, camera, gl } = useThree();
  const { uiState } = useStore();
  const { selectionBoxStart, selectionBoxEnd } = uiState;

  const selectionBox = useMemo(() => {
    return new SelectionBox(camera, scene);
  }, []);

  if (selectionBoxStart) {
    selectionBox.startPoint.set(
      (selectionBoxStart[0] / window.innerWidth) * 2 - 1,
      -(selectionBoxStart[1] / window.innerHeight) * 2 + 1,
      0.5
    );

    selectionBox.endPoint.set(
      (selectionBoxEnd![0] / window.innerWidth) * 2 - 1,
      -(selectionBoxEnd![1] / window.innerHeight) * 2 + 1,
      0.5
    );

    const meshes = selectionBox.select();
    const entities = meshes.forEach(
      mesh =>
        mesh.userData.entity &&
        uiState.selectEntity(mesh.userData.entity as Entity)
    );
  }

  return <primitive object={selectionBox} />;
});

export type GameCanvasProps = {};

export default observer<React.FC<GameCanvasProps>>(() => {
  const { gameStore, uiState, assetCache } = useStore();
  const {
    draggingEntity,
    isDraggingEntity,
    selectionBoxStart,
    selectionBoxEnd
  } = uiState;

  const gameState = gameStore.gameState;

  const [startDragPos, setStartDragPos] = React.useState({ x: 0, y: 0 });

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button === 0) {
      uiState.handleSelectionBoxStart(e);
    } else if (e.button === 2) {
    }
    setStartDragPos({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handlePointerUp = (e: PointerEvent) => {
    const distance = Math.sqrt(
      Math.pow(e.clientX - startDragPos.x, 2) +
        Math.pow(e.clientY - startDragPos.y, 2)
    );

    if (e.button === 0) {
      uiState.handleSelectionBoxEnd(e);
      if (distance < 5) uiState.deselectAll();
    } else if (e.button === 2 && distance < 5) {
      uiState.openContextMenu(e);
    }
  };

  const handlePointerMove = (e: any) => {
    if (isDraggingEntity) {
      let point = new Vector3();
      e.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), point);

      uiState.dragEntity(point.x, point.z);
    } else uiState.handleSelectionBoxMove(e);
  };

  return (
    <>
      {selectionBoxStart && (
        <div
          style={{
            position: "absolute",
            left: selectionBoxStart[0],
            top: selectionBoxStart[1],
            width: selectionBoxEnd![0] - selectionBoxStart[0],
            height: selectionBoxEnd![1] - selectionBoxStart[1],
            border: "dashed white 1px",
            zIndex: 1,
            pointerEvents: "none"
          }}
        ></div>
      )}
      <Canvas
        style={{ background: "#333333", position: "absolute" }}
        camera={{ position: [0, 5, 5] }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        >
        <ambientLight args={["white", 0.2]} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadowMapWidth={2048}
          shadowMapHeight={2048}
        />
        {gameState?.entities.map((entity, i) =>
          entity.render({ entity, key: i })
        )}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
        >
          <meshStandardMaterial
            attach="material"
            color={new Color(0.2, 0.2, 0.2)}
            // map={assetCache.getTexture(
            //   require("../../assets/Wood034_2K_Color.jpg"),
            //   false
            // )}
            // normalMap={assetCache.getTexture(
            //   require("../../assets/Wood034_2K_Normal.jpg"),
            //   false
            // )}
            // roughnessMap={assetCache.getTexture(
            //   require("../../assets/Wood034_2K_Roughness.jpg"),
            //   false
            // )}
          />
          <planeBufferGeometry attach="geometry" args={[50, 50]} />
        </mesh>
        <gridHelper args={[50, 50]} position={[0, 0.001, 0]} />
        <CameraControl />
        <Selection />
        {/* <Outline /> */}
      </Canvas>
    </>
  );
});
