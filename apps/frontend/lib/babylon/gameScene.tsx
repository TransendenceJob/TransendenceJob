import HavokPhysics from "@babylonjs/havok";
import earcut from "earcut";
import {
  ActionManager,
  ArcRotateCamera,
  Color4,
  Engine,
  ExecuteCodeAction,
  HavokPlugin,
  HemisphericLight,
  KeyboardEventTypes,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scene,
  Vector3,
} from "@babylonjs/core";


class Vec2 {
  constructor(public x = 0, public y = 0) {}

  mult(input: number) {
    this.x *= input;
    this.y *= input;
    return this;
  }

  add(input: Vec2) {
    this.x += input.x;
    this.y += input.y;
    return this;
  }

  sub(input: Vec2) {
    this.x -= input.x;
    this.y -= input.y;
    return this;
  }

  dot(input: Vec2) {
    return this.x * input.x + this.y * input.y;
  }

  cross(input: Vec2) {
    return this.x * input.y - this.y * input.x;
  }

  angle() {
    const rawAngle = Math.atan2(this.x, this.y);
    return ((Math.PI * 2) - rawAngle) % (Math.PI * 2);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  static mult(input1: number | Vec2, input2: number | Vec2) {
    if (typeof input1 === "number" && input2 instanceof Vec2) {
      return new Vec2(input2.x * input1, input2.y * input1);
    }
    if (typeof input2 === "number" && input1 instanceof Vec2) {
      return new Vec2(input1.x * input2, input1.y * input2);
    }
    return new Vec2();
  }

  static add(input1: Vec2, input2: Vec2) {
    return new Vec2(input1.x + input2.x, input1.y + input2.y);
  }

  static sub(input1: Vec2, input2: Vec2) {
    return new Vec2(input1.x - input2.x, input1.y - input2.y);
  }

  static dot(input1: Vec2, input2: Vec2) {
    return input1.x * input2.x + input1.y * input2.y;
  }

  static cross(input1: Vec2, input2: Vec2) {
    return input1.x * input2.y - input1.y * input2.x;
  }
}

class DestructibleGround {
  public groundMesh: Mesh | null = null;

  constructor(
    private scene: Scene,
    public debug = false,
    public array: Vector3[] = [],
    public depth = 1,
    public name = "ground",
  ) {
    if (this.array.length > 0) {
      this.rebuildMesh();
    }
  }

  private rebuildMesh() {
    if (this.groundMesh) {
      this.groundMesh.dispose(false, true);
      this.groundMesh = null;
    }

    if (this.array.length === 0) {
      return;
    }

    const mesh = MeshBuilder.ExtrudePolygon(
      this.name,
      {
        shape: this.array,
        depth: this.depth,
        wrap: true,
      },
      this.scene,
      earcut,
    );

    mesh.rotation.x = -Math.PI / 2;
    mesh.position = new Vector3(0, 0, -this.depth / 2);

    new PhysicsAggregate(
      mesh,
      PhysicsShapeType.MESH,
      { mass: 0, restitution: 0.1, friction: 0.8 },
      this.scene,
    );

    this.groundMesh = mesh;
  }

  makeGround(newArray?: Vector3[]) {
    if (newArray) {
      this.array = newArray;
    }
    this.rebuildMesh();
  }

  insideExploCheck(firstX: number, firstY: number, explosionPoint: Vec2, radius: number) {
    const point = new Vec2(firstX, firstY).sub(explosionPoint);
    return point.length() <= radius;
  }

  checkIntersection(point1: Vec2, point2: Vec2, exploPoint: Vec2, radius: number, tolerance: number) {
    const v = Vec2.sub(point2, point1);
    const d = Vec2.sub(point1, exploPoint);

    const a = Vec2.dot(v, v);
    const b = Vec2.dot(v, d) * 2;
    const c = Vec2.dot(d, d) - radius * radius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];

    const sqrtDisc = Math.sqrt(discriminant);
    const fact1 = (-b + sqrtDisc) / (2 * a);
    const fact2 = (-b - sqrtDisc) / (2 * a);

    const results: Vec2[] = [];
    const sortedFactors = [fact1, fact2].sort((x, y) => x - y);

    for (const factor of sortedFactors) {
      if (factor >= -tolerance && factor <= 1 + tolerance) {
        const clamped = Math.max(0, Math.min(1, factor));
        results.push(Vec2.mult(v, clamped).add(point1));
      }
    }

    return results;
  }

  onExitingExplo(newArray: Vector3[], explosionPoint: Vec2, exitPoint: Vec2, radius: number) {
    const entryPoint = new Vec2(newArray[newArray.length - 1].x, newArray[newArray.length - 1].z);
    const exploToEntry = Vec2.sub(entryPoint, explosionPoint);
    const exploToExit = Vec2.sub(exitPoint, explosionPoint);

    const tessellationCount = 10;
    let startAngle = exploToEntry.angle();
    const endAngle = exploToExit.angle();

    if (endAngle >= Math.PI) {
      startAngle += Math.PI * 2;
    }

    const angleDiff = endAngle - startAngle;
    const angleEachStep = angleDiff / tessellationCount;

    for (let i = 1; i < tessellationCount; i++) {
      newArray.push(
        new Vector3(
          -Math.sin(startAngle + angleEachStep * i) * radius + explosionPoint.x,
          0,
          Math.cos(startAngle + angleEachStep * i) * radius + explosionPoint.y,
        ),
      );
    }

    newArray.push(new Vector3(exitPoint.x, 0, exitPoint.y));
  }

  affectTerrain(explosionX: number, explosionY: number, radius: number) {
    const array = this.array;
    const explosionPoint = new Vec2(explosionX, explosionY);
    const len = array.length;
    let startIndex = -1;

    for (let i = 0; i < len; i++) {
      if (!this.insideExploCheck(array[i].x, array[i].z, explosionPoint, radius)) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      this.makeGround([]);
      return;
    }

    const newArray: Vector3[] = [];
    let insideExplosion = false;

    for (let i = 0; i < len; i++) {
      const currentIndex = (startIndex + i) % len;
      const nextIndex = (startIndex + i + 1) % len;

      const point1 = new Vec2(array[currentIndex].x, array[currentIndex].z);
      const point2 = new Vec2(array[nextIndex].x, array[nextIndex].z);
      const intersectPoints = this.checkIntersection(point1, point2, explosionPoint, radius, 0.00001);

      if (!insideExplosion) {
        newArray.push(new Vector3(point1.x, 0, point1.y));

        if (intersectPoints.length === 1) {
          insideExplosion = true;
          newArray.push(new Vector3(intersectPoints[0].x, 0, intersectPoints[0].y));
        } else if (intersectPoints.length === 2) {
          newArray.push(new Vector3(intersectPoints[0].x, 0, intersectPoints[0].y));
          this.onExitingExplo(newArray, explosionPoint, intersectPoints[1], radius);
        }
      } else if (intersectPoints.length === 1) {
        insideExplosion = false;
        this.onExitingExplo(newArray, explosionPoint, intersectPoints[0], radius);
      }
    }

    this.makeGround(newArray);
  }
}

function createCamera(scene: Scene, canvas: HTMLCanvasElement, posX = 0, posY = 0, maxDistance = 8) {
  const camera = new ArcRotateCamera(
    "Camera",
    -Math.PI / 2,
    Math.PI / 2,
    10,
    new Vector3(0, 0, 0),
    scene,
  );

  camera.position = new Vector3(posX, posY, -maxDistance);
  camera.target = new Vector3(posX, posY, 0);
  camera.attachControl(canvas, true);
  camera.wheelPrecision = 20;
  camera.minZ = 0.3;
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = maxDistance;
  camera.angularSensibilityX = 999999;
  camera.angularSensibilityY = 999999;
  camera.useBouncingBehavior = false;
  camera.fov = 1;

  scene.onBeforeRenderObservable.add(() => {
   const upperRadiusLimit = camera.upperRadiusLimit;
  const lowerRadiusLimit = camera.lowerRadiusLimit;

  if (upperRadiusLimit == null || lowerRadiusLimit == null) {
    return;
  }

  const width = upperRadiusLimit * 0.74 - 1.475;
  const zoomRatio =
    1 - (camera.radius - lowerRadiusLimit) / (upperRadiusLimit - lowerRadiusLimit);
  const xLimit = width * zoomRatio;

    if (camera.target.x < -xLimit) camera.target.x = -xLimit;
    if (camera.target.x > xLimit) camera.target.x = xLimit;
  });

  return camera;
}

function createPlayer(scene: Scene) {
  const box = MeshBuilder.CreateBox("player-box", { size: 0.5, height: 0.7 }, scene);
  const sphere = MeshBuilder.CreateSphere("player-head", { diameter: 0.5, segments: 10 }, scene);
  sphere.position.y = 0.35;

  const player = Mesh.MergeMeshes([box, sphere], true, false, undefined, false, false)!;
  player.name = "player";
  player.position.y = 2;
  player.rotation.z = Math.PI * (3 / 4);

  let left = false;
  let right = false;
  let up = false;
  let down = false;
  let rotR = false;
  let rotL = false;

  const speed = 0.05;
  const rotSpeed = 0.025;

  scene.onKeyboardObservable.add((kbInfo) => {
    const setBool = kbInfo.type === KeyboardEventTypes.KEYDOWN;

    if (kbInfo.type === KeyboardEventTypes.KEYDOWN || kbInfo.type === KeyboardEventTypes.KEYUP) {
      if (kbInfo.event.key === "a") left = setBool;
      if (kbInfo.event.key === "d") right = setBool;
      if (kbInfo.event.key === "w") up = setBool;
      if (kbInfo.event.key === "s") down = setBool;
      if (kbInfo.event.key === "q") rotR = setBool;
      if (kbInfo.event.key === "e") rotL = setBool;
    }
  });

  scene.actionManager ??= new ActionManager(scene);
  scene.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnEveryFrameTrigger, () => {
      if (rotR) player.rotation.z += rotSpeed;
      if (rotL) player.rotation.z -= rotSpeed;
      if (up) player.position.y += speed;
      if (down) player.position.y -= speed;
      if (right) player.position.x += speed;
      if (left) player.position.x -= speed;
    }),
  );

  return player;
}

function angleToVector(angle: number) {
  return [-Math.sin(angle), Math.cos(angle)];
}

function registerExplosions(
  scene: Scene,
  player: Mesh,
  ground: DestructibleGround,
) {
  scene.onKeyboardObservable.add((kbInfo) => {
    if (kbInfo.type === KeyboardEventTypes.KEYDOWN && kbInfo.event.key === " ") {
      const [dx, dy] = angleToVector(player.rotation.z);
      const explosionDistance = 1.5;
      const radius = 0.5;

      const explosionX = player.position.x + dx * explosionDistance;
      const explosionY = player.position.y + dy * explosionDistance;

      ground.affectTerrain(explosionX, explosionY, radius);

      const marker = MeshBuilder.CreateSphere("boom", { diameter: radius * 2, segments: 12 }, scene);
      marker.position = new Vector3(explosionX, explosionY, 0);
      marker.visibility = 0.35;

      setTimeout(() => marker.dispose(), 150);
    }
  });
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement) {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.04, 0.04, 0.06, 1);
  scene.actionManager = new ActionManager(scene);

  const havok = await HavokPhysics();
  const hk = new HavokPlugin(true, havok);
  scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  const initialGround = [
    new Vector3(5, 0, -2),
    new Vector3(5, 0, 0),
    new Vector3(4, 0, 1),
    new Vector3(-4, 0, 1),
    new Vector3(-5, 0, 0),
    new Vector3(-5, 0, -2),
  ];

  const ground = new DestructibleGround(scene, true, initialGround, 1, "ground");
  createCamera(scene, canvas, 0, 0, 10);
  const player = createPlayer(scene);
  registerExplosions(scene, player, ground);

  return scene;
}