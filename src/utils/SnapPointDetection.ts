import { SnapPoint } from "../models/game/Entity";

export function detectSnapPoints(imageUrl: string) {
  return new Promise<SnapPoint[]>((resolve, reject) => {
    const img = document.createElement("img");
    img.setAttribute("crossOrigin", "Anonymous");
    img.setAttribute("src", imageUrl);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 512;
      const ratio = img.width / img.height;
      const width = Math.floor(ratio >= 1 ? size : size * ratio);
      const height = Math.floor(ratio <= 1 ? size : size / ratio);
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d")!;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const blobs = detectBlobs(imageData);
      const snapPoints = Object.values(blobs).map(blob => ({
        x: blob.cx,
        z: blob.cy,
        angle: blob.angle
      }));
      resolve(snapPoints);
    };
  });
}

type Blob = {
  label: number;
  cx: number;
  cy: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  mass: number;
  angleMarkerX: number;
  angleMarkerY: number;
  angle: number;
};

function detectBlobs(imageData: ImageData) {
  const width = imageData.width;
  const height = imageData.height;
  const srcData = imageData.data;
  const minBlobMass = 1;
  const maxBlobMass = Number.MAX_VALUE;

  const labelBuffer = Array<number>(width * height).fill(0);

  // The maximum number of blobs is given by an image filled with equally spaced single pixel
  // blobs. For images with less blobs, memory will be wasted, but this approach is simpler and
  // probably quicker than dynamically resizing arrays
  const tableSize = (width * height) / 4;

  const labelTable = Array<number>(tableSize).fill(0);
  const xMinTable = Array<number>(tableSize).fill(0);
  const xMaxTable = Array<number>(tableSize).fill(0);
  const yMinTable = Array<number>(tableSize).fill(0);
  const yMaxTable = Array<number>(tableSize).fill(0);
  const massTable = Array<number>(tableSize).fill(0);
  const angleMarkerTable = Array<boolean>(width * height).fill(false);
  // This is the neighbouring pixel pattern. For position X, A, B, C & D are checked
  // A B C
  // D X

  let srcPtr = 0;
  let aPtr = -width - 1;
  let bPtr = -width;
  let cPtr = -width + 1;
  let dPtr = -1;

  let label = 1;

  const blobs: { [k: number]: Blob } = {};

  // Iterate through pixels looking for connected regions. Assigning labels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      labelBuffer[srcPtr] = 0;
      const pos = (x + y * width) * 4;

      const value = srcData[pos + 3];

      // Check if on foreground pixel
      if (value > 127) {
        const isAngleMarker = srcData[pos + 1] > 127;
        angleMarkerTable[srcPtr] = isAngleMarker;

        // Find label for neighbours (0 if out of range)
        let aLabel = x > 0 && y > 0 ? labelTable[labelBuffer[aPtr]] : 0;
        let bLabel = y > 0 ? labelTable[labelBuffer[bPtr]] : 0;
        let cLabel = x < width - 1 && y > 0 ? labelTable[labelBuffer[cPtr]] : 0;
        let dLabel = x > 0 ? labelTable[labelBuffer[dPtr]] : 0;

        // Look for label with least value
        let min = Number.MAX_VALUE;
        if (aLabel != 0 && aLabel < min) min = aLabel;
        if (bLabel != 0 && bLabel < min) min = bLabel;
        if (cLabel != 0 && cLabel < min) min = cLabel;
        if (dLabel != 0 && dLabel < min) min = dLabel;

        // If no neighbours in foreground
        if (min == Number.MAX_VALUE) {
          labelBuffer[srcPtr] = label;
          labelTable[label] = label;

          // Initialise min/max x,y for label
          yMinTable[label] = y;
          yMaxTable[label] = y;
          xMinTable[label] = x;
          xMaxTable[label] = x;
          massTable[label] = 1;

          label++;
        }

        // Neighbour found
        else {
          // Label pixel with lowest label from neighbours
          labelBuffer[srcPtr] = min;

          // Update min/max x,y for label
          yMaxTable[min] = y;
          massTable[min]++;
          if (x < xMinTable[min]) xMinTable[min] = x;
          if (x > xMaxTable[min]) xMaxTable[min] = x;

          if (aLabel != 0) labelTable[aLabel] = min;
          if (bLabel != 0) labelTable[bLabel] = min;
          if (cLabel != 0) labelTable[cLabel] = min;
          if (dLabel != 0) labelTable[dLabel] = min;
        }
      }

      srcPtr++;
      aPtr++;
      bPtr++;
      cPtr++;
      dPtr++;
    }
  }

  // Iterate through labels pushing min/max x,y values towards minimum label
  for (let i = label - 1; i > 0; i--) {
    if (labelTable[i] != i) {
      if (xMaxTable[i] > xMaxTable[labelTable[i]])
        xMaxTable[labelTable[i]] = xMaxTable[i];
      if (xMinTable[i] < xMinTable[labelTable[i]])
        xMinTable[labelTable[i]] = xMinTable[i];
      if (yMaxTable[i] > yMaxTable[labelTable[i]])
        yMaxTable[labelTable[i]] = yMaxTable[i];
      if (yMinTable[i] < yMinTable[labelTable[i]])
        yMinTable[labelTable[i]] = yMinTable[i];
      massTable[labelTable[i]] += massTable[i];

      let l = i;
      while (l != labelTable[l]) l = labelTable[l];
      labelTable[i] = l;
    } else {
      // Ignore blobs that butt against corners
      if (i == labelBuffer[0]) continue; // Top Left
      if (i == labelBuffer[width]) continue; // Top Right
      if (i == labelBuffer[width * height - width + 1]) continue; // Bottom Left
      if (i == labelBuffer[width * height - 1]) continue; // Bottom Right

      if (
        massTable[i] >= minBlobMass &&
        (massTable[i] <= maxBlobMass || maxBlobMass == -1)
      ) {
        const blob: Blob = {
          label: labelTable[i],
          cx: (xMaxTable[i] + xMinTable[i]) / 2 / width - 0.5,
          cy: (yMaxTable[i] + yMinTable[i]) / 2 / height - 0.5,
          xMin: xMinTable[i],
          xMax: xMaxTable[i],
          yMin: yMinTable[i],
          yMax: yMaxTable[i],
          mass: massTable[i],
          angleMarkerX: 0,
          angleMarkerY: 0,
          angle: 0
        };
        blobs[labelTable[i]] = blob;
      }
    }
  }

  for (let i = 0; i < labelBuffer.length; i++) {
    const id = labelBuffer[i];
    if (id === 0) continue;

    const x = (i % width) / width - 0.5;
    const y = Math.floor(i / width) / height - 0.5;

    const label = labelTable[id];
    const blob = blobs[label];

    const isAngleMarker = angleMarkerTable[i];
    if (isAngleMarker) {
      blob.angleMarkerX += x;
      blob.angleMarkerY += y;
    }
  }

  for (const blob of Object.values(blobs)) {
    blob.angleMarkerX /= blob.mass;
    blob.angleMarkerY /= blob.mass;

    blob.angle = Math.atan2(
      blob.angleMarkerY - blob.cy,
      blob.angleMarkerX - blob.cx
    );

    blob.angle += Math.PI / 2;
  }

  return blobs;
}
