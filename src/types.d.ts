// declare module "@react-navigation/web";
// declare module "@react-navigation/core";
// declare module "react-native-slider";
// declare module "fetch-readablestream";

import { extend, ReactThreeFiber } from "react-three-fiber";
// import { DragControls } from "three/examples/jsm/controls/DragControls";
import CameraControls from "camera-controls";
import * as THREE from "three";

extend({ CameraControls });
CameraControls.install({ THREE: THREE });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cameraControls: ReactThreeFiber.Object3DNode<
        CameraControls,
        typeof CameraControls
      >;
      // dragControls: ReactThreeFiber.Node<
      //   DragControls,
      //   typeof DragControls
      // >;
    }
  }
}
