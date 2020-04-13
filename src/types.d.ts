// declare module "@react-navigation/web";
// declare module "@react-navigation/core";
// declare module "react-native-slider";
// declare module "fetch-readablestream";

import { extend, ReactThreeFiber } from "react-three-fiber";
import CameraControls from "camera-controls";
import { DragControls } from "three/examples/jsm/controls/DragControls";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cameraControls: ReactThreeFiber.Node<
        CameraControls,
        typeof CameraControls
      >;
      dragControls: any;
    }
  }
}
