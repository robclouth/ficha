// @ts-nocheck
import * as THREE from "three";
import { uniqBy } from "lodash";

export class DiceObject {
  geometry;
  textures;
  faceRotations;
  labels;
  /**
   * @constructor
   * @param {object} options
   * @param {Number} [options.size = 100]
   * @param {Number} [options.fontColor = '#000000']
   * @param {Number} [options.backColor = '#ffffff']
   */
  constructor(options) {
    options = this.setDefaults(options, {
      size: 0.1,
      fontColor: "#000000",
      backColor: "#ffffff"
    });

    this.object = null;
    this.size = options.size;
    this.invertUpside = false;

    this.labelColor = options.fontColor;
    this.diceColor = options.backColor;
    this.labels = options.labels;
  }

  setDefaults(options, defaults) {
    options = options || {};

    for (let key in defaults) {
      if (!defaults.hasOwnProperty(key)) continue;

      if (!(key in options)) {
        options[key] = defaults[key];
      }
    }

    return options;
  }

  getFaceRotations() {
    let offsets = [];
    let vector = new THREE.Vector3(0, this.invertUpside ? -1 : 1);

    const uniqueFaces = uniqBy(
      this.geometry.faces.filter(face => face.materialIndex !== 0),
      face => face.materialIndex
    );

    return uniqueFaces.map(face => {
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(face.normal, vector);
      return quaternion;
    });
  }

  getUpsideValue() {
    let vector = new THREE.Vector3(0, this.invertUpside ? -1 : 1);
    let closest_face;
    let closest_angle = Math.PI * 2;
    for (let i = 0; i < this.geometry.faces.length; ++i) {
      let face = this.geometry.faces[i];
      if (face.materialIndex === 0) continue;

      let angle = face.normal.clone().angleTo(vector);
      if (angle < closest_angle) {
        closest_angle = angle;
        closest_face = face;
      }
    }

    return closest_face.materialIndex - 1;
  }

  getChamferGeometry(vectors, faces, chamfer) {
    let chamfer_vectors = [],
      chamfer_faces = [],
      corner_faces = new Array(vectors.length);
    for (let i = 0; i < vectors.length; ++i) corner_faces[i] = [];
    for (let i = 0; i < faces.length; ++i) {
      let ii = faces[i],
        fl = ii.length - 1;
      let center_point = new THREE.Vector3();
      let face = new Array(fl);
      for (let j = 0; j < fl; ++j) {
        let vv = vectors[ii[j]].clone();
        center_point.add(vv);
        corner_faces[ii[j]].push((face[j] = chamfer_vectors.push(vv) - 1));
      }
      center_point.divideScalar(fl);
      for (let j = 0; j < fl; ++j) {
        let vv = chamfer_vectors[face[j]];
        vv.subVectors(vv, center_point)
          .multiplyScalar(chamfer)
          .addVectors(vv, center_point);
      }
      face.push(ii[fl]);
      chamfer_faces.push(face);
    }
    for (let i = 0; i < faces.length - 1; ++i) {
      for (let j = i + 1; j < faces.length; ++j) {
        let pairs = [],
          lastm = -1;
        for (let m = 0; m < faces[i].length - 1; ++m) {
          let n = faces[j].indexOf(faces[i][m]);
          if (n >= 0 && n < faces[j].length - 1) {
            if (lastm >= 0 && m !== lastm + 1) pairs.unshift([i, m], [j, n]);
            else pairs.push([i, m], [j, n]);
            lastm = m;
          }
        }
        if (pairs.length !== 4) continue;
        chamfer_faces.push([
          chamfer_faces[pairs[0][0]][pairs[0][1]],
          chamfer_faces[pairs[1][0]][pairs[1][1]],
          chamfer_faces[pairs[3][0]][pairs[3][1]],
          chamfer_faces[pairs[2][0]][pairs[2][1]],
          -1
        ]);
      }
    }
    for (let i = 0; i < corner_faces.length; ++i) {
      let cf = corner_faces[i],
        face = [cf[0]],
        count = cf.length - 1;
      while (count) {
        for (let m = faces.length; m < chamfer_faces.length; ++m) {
          let index = chamfer_faces[m].indexOf(face[face.length - 1]);
          if (index >= 0 && index < 4) {
            if (--index === -1) index = 3;
            let next_vertex = chamfer_faces[m][index];
            if (cf.indexOf(next_vertex) >= 0) {
              face.push(next_vertex);
              break;
            }
          }
        }
        --count;
      }
      face.push(-1);
      chamfer_faces.push(face);
    }
    return { vectors: chamfer_vectors, faces: chamfer_faces };
  }

  makeGeometry(vertices, faces, radius, tab, af) {
    let geom = new THREE.Geometry();
    for (let i = 0; i < vertices.length; ++i) {
      let vertex = vertices[i].multiplyScalar(radius);
      vertex.index = geom.vertices.push(vertex) - 1;
    }
    for (let i = 0; i < faces.length; ++i) {
      let ii = faces[i],
        fl = ii.length - 1;
      let aa = (Math.PI * 2) / fl;
      for (let j = 0; j < fl - 2; ++j) {
        geom.faces.push(
          new THREE.Face3(
            ii[0],
            ii[j + 1],
            ii[j + 2],
            [
              geom.vertices[ii[0]],
              geom.vertices[ii[j + 1]],
              geom.vertices[ii[j + 2]]
            ],
            0,
            ii[fl] + 1
          )
        );
        geom.faceVertexUvs[0].push([
          new THREE.Vector2(
            (Math.cos(af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)
          ),
          new THREE.Vector2(
            (Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)
          ),
          new THREE.Vector2(
            (Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab)
          )
        ]);
      }
    }
    geom.computeFaceNormals();
    return geom;
  }

  getGeometry() {
    let radius = this.size * this.scaleFactor;

    let vectors = new Array(this.vertices.length);
    for (let i = 0; i < this.vertices.length; ++i) {
      vectors[i] = new THREE.Vector3().fromArray(this.vertices[i]).normalize();
    }

    let chamferGeometry = this.getChamferGeometry(
      vectors,
      this.faces,
      this.chamfer
    );
    let geometry = this.makeGeometry(
      chamferGeometry.vectors,
      chamferGeometry.faces,
      radius,
      this.tab,
      this.af
    );

    return geometry;
  }

  calculateTextureSize(approx) {
    return Math.max(
      128,
      Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)))
    );
  }

  createTextTexture(labelIndex, color, backColor) {
    const text =
      labelIndex >= 0 && this.labels[labelIndex] ? this.labels[labelIndex] : "";
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    let ts =
      this.calculateTextureSize(this.size / 2 + this.size * this.textMargin) *
      2;
    canvas.width = canvas.height = ts;
    context.font = ts / (1 + 2 * this.textMargin) + "pt Roboto";
    context.fillStyle = backColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  getTextures() {
    let textures = [];
    for (let i = 0; i < this.faceTexts.length; ++i) {
      let texture = null;
      if (this.customTextTextureFunction) {
        texture = this.customTextTextureFunction(
          this.faceTexts[i],
          this.labelColor,
          this.diceColor
        );
      } else {
        texture = this.createTextTexture(
          this.faceTexts[i],
          this.labelColor,
          this.diceColor
        );
      }

      textures.push(texture);
    }
    return textures;
  }

  create() {
    this.geometry = this.getGeometry();
    this.textures = this.getTextures();
    this.faceRotations = this.getFaceRotations();
  }
}

export class DiceD4 extends DiceObject {
  constructor(options) {
    super(options);

    this.tab = -0.1;
    this.af = (Math.PI * 7) / 6;
    this.chamfer = 0.96;
    this.vertices = [
      [1, 1, 1],
      [-1, -1, 1],
      [-1, 1, -1],
      [1, -1, -1]
    ];
    this.faces = [
      [1, 0, 2, 1],
      [0, 1, 3, 2],
      [0, 3, 2, 3],
      [1, 2, 3, 4]
    ];
    this.scaleFactor = 1.2;
    this.values = 4;
    this.faceTexts = [
      [],
      [-1, -1, -1],
      [1, 3, 2],
      [0, 2, 3],
      [1, 0, 3],
      [0, 1, 2]
    ];
    this.customTextTextureFunction = function(labelIndices, color, backColor) {
      const texts = labelIndices.map(index =>
        index >= 0 && this.labels[index] ? this.labels[index] : ""
      );

      let canvas = document.createElement("canvas");
      let context = canvas.getContext("2d");
      let ts = this.calculateTextureSize(this.size / 2 + this.size * 2) * 2;
      canvas.width = canvas.height = ts;
      context.font = ts / 5 + "pt Roboto";
      context.fillStyle = backColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = color;
      for (let i in texts) {
        context.fillText(
          texts[i],
          canvas.width / 2,
          canvas.height / 2 - ts * 0.3
        );
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate((Math.PI * 2) / 3);
        context.translate(-canvas.width / 2, -canvas.height / 2);
      }
      let texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      return texture;
    };
    this.mass = 300;
    this.inertia = 5;
    this.invertUpside = true;

    this.create();
  }
}

export class DiceD6 extends DiceObject {
  constructor(options) {
    super(options);

    this.tab = 0.1;
    this.af = Math.PI / 4;
    this.chamfer = 0.96;
    this.vertices = [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1]
    ];
    this.faces = [
      [0, 3, 2, 1, 1],
      [1, 2, 6, 5, 2],
      [0, 1, 5, 4, 3],
      [3, 7, 6, 2, 4],
      [0, 4, 7, 3, 5],
      [4, 5, 6, 7, 6]
    ];
    this.scaleFactor = 0.9;
    this.values = 6;
    this.faceTexts = [
      -1,
      -1,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19
    ];
    this.textMargin = 1.0;
    this.mass = 300;
    this.inertia = 13;

    this.create();
  }
}

export class DiceD8 extends DiceObject {
  constructor(options) {
    super(options);

    this.tab = 0;
    this.af = -Math.PI / 4 / 2;
    this.chamfer = 0.965;
    this.vertices = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1]
    ];
    this.faces = [
      [0, 2, 4, 1],
      [0, 4, 3, 2],
      [0, 3, 5, 3],
      [0, 5, 2, 4],
      [1, 3, 4, 5],
      [1, 4, 2, 6],
      [1, 2, 5, 7],
      [1, 5, 3, 8]
    ];
    this.scaleFactor = 1;
    this.values = 8;
    this.faceTexts = [
      -1,
      -1,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19
    ];
    this.textMargin = 1.2;
    this.mass = 340;
    this.inertia = 10;

    this.create();
  }
}

export class DiceD10 extends DiceObject {
  constructor(options) {
    super(options);

    this.tab = 0;
    this.af = (Math.PI * 6) / 5;
    this.chamfer = 0.945;
    this.vertices = [];
    this.faces = [
      [5, 7, 11, 0],
      [4, 2, 10, 1],
      [1, 3, 11, 2],
      [0, 8, 10, 3],
      [7, 9, 11, 4],
      [8, 6, 10, 5],
      [9, 1, 11, 6],
      [2, 0, 10, 7],
      [3, 5, 11, 8],
      [6, 4, 10, 9],
      [1, 0, 2, -1],
      [1, 2, 3, -1],
      [3, 2, 4, -1],
      [3, 4, 5, -1],
      [5, 4, 6, -1],
      [5, 6, 7, -1],
      [7, 6, 8, -1],
      [7, 8, 9, -1],
      [9, 8, 0, -1],
      [9, 0, 1, -1]
    ];

    for (let i = 0, b = 0; i < 10; ++i, b += (Math.PI * 2) / 10) {
      this.vertices.push([Math.cos(b), Math.sin(b), 0.105 * (i % 2 ? 1 : -1)]);
    }
    this.vertices.push([0, 0, -1]);
    this.vertices.push([0, 0, 1]);

    this.scaleFactor = 0.9;
    this.values = 10;
    this.faceTexts = [
      -1,
      -1,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19
    ];
    this.textMargin = 1.0;
    this.mass = 350;
    this.inertia = 9;

    this.create();
  }
}

export class DiceD12 extends DiceObject {
  constructor(options) {
    super(options);

    let p = (1 + Math.sqrt(5)) / 2;
    let q = 1 / p;

    this.tab = 0.2;
    this.af = -Math.PI / 4 / 2;
    this.chamfer = 0.968;
    this.vertices = [
      [0, q, p],
      [0, q, -p],
      [0, -q, p],
      [0, -q, -p],
      [p, 0, q],
      [p, 0, -q],
      [-p, 0, q],
      [-p, 0, -q],
      [q, p, 0],
      [q, -p, 0],
      [-q, p, 0],
      [-q, -p, 0],
      [1, 1, 1],
      [1, 1, -1],
      [1, -1, 1],
      [1, -1, -1],
      [-1, 1, 1],
      [-1, 1, -1],
      [-1, -1, 1],
      [-1, -1, -1]
    ];
    this.faces = [
      [2, 14, 4, 12, 0, 1],
      [15, 9, 11, 19, 3, 2],
      [16, 10, 17, 7, 6, 3],
      [6, 7, 19, 11, 18, 4],
      [6, 18, 2, 0, 16, 5],
      [18, 11, 9, 14, 2, 6],
      [1, 17, 10, 8, 13, 7],
      [1, 13, 5, 15, 3, 8],
      [13, 8, 12, 4, 5, 9],
      [5, 4, 14, 9, 15, 10],
      [0, 12, 8, 10, 16, 11],
      [3, 19, 7, 17, 1, 12]
    ];
    this.scaleFactor = 0.9;
    this.values = 12;
    this.faceTexts = [
      -1,
      -1,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19
    ];
    this.textMargin = 1.0;
    this.mass = 350;
    this.inertia = 8;

    this.create();
  }
}

export class DiceD20 extends DiceObject {
  constructor(options) {
    super(options);

    let t = (1 + Math.sqrt(5)) / 2;

    this.tab = -0.2;
    this.af = -Math.PI / 4 / 2;
    this.chamfer = 0.955;
    this.vertices = [
      [-1, t, 0],
      [1, t, 0],
      [-1, -t, 0],
      [1, -t, 0],
      [0, -1, t],
      [0, 1, t],
      [0, -1, -t],
      [0, 1, -t],
      [t, 0, -1],
      [t, 0, 1],
      [-t, 0, -1],
      [-t, 0, 1]
    ];
    this.faces = [
      [0, 11, 5, 1],
      [0, 5, 1, 2],
      [0, 1, 7, 3],
      [0, 7, 10, 4],
      [0, 10, 11, 5],
      [1, 5, 9, 6],
      [5, 11, 4, 7],
      [11, 10, 2, 8],
      [10, 7, 6, 9],
      [7, 1, 8, 10],
      [3, 9, 4, 11],
      [3, 4, 2, 12],
      [3, 2, 6, 13],
      [3, 6, 8, 14],
      [3, 8, 9, 15],
      [4, 9, 5, 16],
      [2, 4, 11, 17],
      [6, 2, 10, 18],
      [8, 6, 7, 19],
      [9, 8, 1, 20]
    ];
    this.scaleFactor = 1;
    this.values = 20;
    this.faceTexts = [
      -1,
      -1,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19
    ];
    this.textMargin = 1.0;
    this.mass = 400;
    this.inertia = 6;

    this.create();
  }
}
