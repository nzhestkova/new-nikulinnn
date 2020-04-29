import { Mesh, MeshBasicMaterial, Object3D, Raycaster, Scene, SphereGeometry, Vector3 } from "three";

export class Ball {
  degToRad = Math.PI / 180;
  step = 0.1;
  weight = 100;
  id: number;
  radius: number;
  startSpeed: number;
  startAngle: number;
  horizontalAngle: number;
  startPosition: Vector3;
  speedRecoveryCoefficient: number;
  airResistance: number;
  onGround: boolean;
  timeline: number;
  object3D: Object3D;
  plane: {
    length: number;
    width: number;
    height: number;
  };

  point: Mesh;
  scene: Scene;
  rayCaster: Raycaster;
  constructor(id: number, radius: number, startSpeed: number, startAngle: number,
              startPosition: Vector3, speedRecoveryCoefficient: number, airResistance: number,
              object3D: Object3D, scene: Scene, horizontalAngle: number, plane: { length: number, width: number, height: number }) {
    this.id = id;
    this.radius = radius;
    this.startSpeed = startSpeed;
    this.startAngle = startAngle;
    this.startPosition = startPosition;
    this.speedRecoveryCoefficient = speedRecoveryCoefficient;
    this.airResistance = airResistance;
    this.object3D = object3D;
    this.scene = scene;
    this.horizontalAngle = horizontalAngle;
    this.timeline = 0;
    this.plane = plane;

    this.object3D.position.set(this.startPosition.x, this.startPosition.y, this.startPosition.z);
    const pointGeometry = new SphereGeometry(3, 50);
    const pointMaterial = new MeshBasicMaterial( { color: 0xFFFFFF } );
    this.point = new Mesh(pointGeometry, pointMaterial);
    // this.scene.add(this.point);
    this.rayCaster = new Raycaster();
  }

  animate(): void {
    this.onGround = this.object3D.position.y < 0;
    if (!this.onGround) {
      this.move();
      return;
    }
    this.startSpeed *= this.speedRecoveryCoefficient;
    if (this.startSpeed > 0 && this.startSpeed < 5 && this.speedRecoveryCoefficient !== 1) {
      this.startSpeed -= this.startSpeed * this.speedRecoveryCoefficient;
    }
    this.startAngle = this.startAngle > 0 ? this.startAngle : -this.startAngle;
    this.object3D.position.set(this.object3D.position.x, this.object3D.position.y + Math.abs(0 - this.object3D.position.y), this.object3D.position.z);
    this.move();
  }

  getPlane(): {xK: number, yK: number, zK: number, D: number} {
    const wall = this.scene.getObjectByName(`wall`);
    const currentVertAngle = wall.rotation.z;
    const currentHorizAngle = wall.rotation.y;

    const point_0 = wall.position;
    const point_1 = new Vector3(
      wall.position.x + this.plane.length * Math.cos(currentVertAngle) * Math.cos(currentHorizAngle),
      wall.position.y + this.plane.length * Math.sin(currentVertAngle),
      wall.position.z - this.plane.length * Math.cos(currentVertAngle) * Math.sin(currentHorizAngle));
    const point_2 = new Vector3(
      wall.position.x - this.plane.width * Math.cos(Math.PI / 2 - currentHorizAngle),
      wall.position.y,
      wall.position.z - this.plane.width * Math.sin(Math.PI / 2 - currentHorizAngle));

    const xK = (point_1.y - point_0.y) * (point_2.z - point_0.z) - (point_2.y - point_0.y) * (point_1.z - point_0.z);
    const yK = (point_1.x - point_0.x) * (point_2.z - point_0.z) - (point_2.x - point_0.x) * (point_1.z - point_0.z);
    const zK = (point_1.x - point_0.x) * (point_2.y - point_0.y) - (point_2.x - point_0.x) * (point_1.y - point_0.y);
    const D = (-point_0.x) * xK + (-point_0.y) * yK + (-point_0.z) * zK;
    return {xK: xK, yK: yK, zK: zK, D: D};
  }

  // checkCollision(leftBorder: Vector3, rightBorder: Vector3): boolean {
  //   const onX = this.object3D.position.x >= leftBorder.x - this.radius && this.object3D.position.x <= rightBorder.x;
  //   const onY = this.object3D.position.y >= leftBorder.y && this.object3D.position.y <= rightBorder.y;
  //   const onZ = this.object3D.position.z >= leftBorder.z - this.radius && this.object3D.position.z <= rightBorder.z;
  //   return onX && onY && onZ;
  // }

  checkCollision2(): boolean {
    const wall = this.scene.getObjectByName(`wall`);
    const points: Vector3[] = [
      // this.currentPos(),
      this.object3D.position,
      new Vector3(this.object3D.position.x + this.radius, this.object3D.position.y, this.object3D.position.z),
      // new Vector3(this.object3D.position.x - this.radius, this.object3D.position.y, this.object3D.position.z),
      // new Vector3(this.object3D.position.x, this.object3D.position.y + this.radius, this.object3D.position.z),
      new Vector3(this.object3D.position.x, this.object3D.position.y - this.radius, this.object3D.position.z),
      // new Vector3(this.object3D.position.x, this.object3D.position.y, this.object3D.position.z + this.radius),
      // new Vector3(this.object3D.position.x, this.object3D.position.y, this.object3D.position.z - this.radius),
    ];

    const currentVertAngle = wall.rotation.z;
    const currentHorizAngle = wall.rotation.y;

    const leftX = wall.position.x - this.plane.height - Math.abs(this.plane.length * Math.cos(currentVertAngle) * Math.cos(currentHorizAngle))
      - Math.abs(this.plane.width * Math.cos(currentVertAngle) * Math.sin(currentHorizAngle));
    const rightX = wall.position.x + this.plane.height + Math.abs(this.plane.length * Math.cos(currentVertAngle) * Math.cos(currentHorizAngle))
      + Math.abs(this.plane.width * Math.cos(currentVertAngle) * Math.sin(currentHorizAngle));

    const leftY = wall.position.y - this.plane.height - Math.abs(this.plane.length * Math.sin(currentVertAngle));
    const rightY = wall.position.y + this.plane.height + Math.abs(this.plane.length * Math.sin(currentVertAngle));

    const leftZ = wall.position.z - Math.abs(this.plane.width * Math.cos(currentHorizAngle))
      - Math.abs(this.plane.length * Math.sin(currentHorizAngle));
    const rightZ = wall.position.z + Math.abs(this.plane.width * Math.cos(currentHorizAngle))
      + Math.abs(this.plane.length * Math.sin(currentHorizAngle));

    const result = this.getPlane();

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < points.length; i += 1) {
      const onX = points[i].x >= leftX && points[i].x <= rightX;
      const onY = points[i].y >= leftY && points[i].y <= rightY;
      const onZ = points[i].z >= leftZ && points[i].z <= rightZ;
      const distanceToPlane = Math.abs(result.xK * points[i].x + result.yK * points[i].y + result.zK * points[i].z + result.D)
        / Math.sqrt(Math.pow(result.xK, 2) + Math.pow(result.yK, 2) + Math.pow(result.zK, 2));
      if (onX && onY && onZ && Math.abs(Math.floor(distanceToPlane)) === 0) {

        return true;
      }
    }
    return false;
  }

  currentPos(): Vector3 {
    return new Vector3(
      this.object3D.position.x + this.radius * Math.cos(this.startAngle * this.degToRad) * Math.cos(this.horizontalAngle * this.degToRad),
      this.object3D.position.y + this.radius * Math.sin(this.startAngle * this.degToRad),
      this.object3D.position.z + this.radius * Math.cos(this.startAngle * this.degToRad) * Math.sin(this.horizontalAngle * this.degToRad),
    );
  }
  collision(): void {
    if (this.checkCollision2()) {
      this.startSpeed *= this.speedRecoveryCoefficient;
      this.horizontalAngle = -2 * this.scene.getObjectByName(`wall`).rotation.y / this.degToRad + this.horizontalAngle;
      if (Math.abs(this.horizontalAngle) >= 90) {
        this.horizontalAngle = Math.sign(this.horizontalAngle) * (180 - Math.abs(this.horizontalAngle));
        this.startAngle = 180 % this.startAngle;
      }
      this.object3D.position.set(
        this.object3D.position.x - 0.2,
        this.object3D.position.y - 0.2,
        this.object3D.position.z - 0.2,
      );
      this.startAngle = 2 * this.scene.getObjectByName(`wall`).rotation.z / this.degToRad - this.startAngle;
      this.move();
    }
  }

  newPosition(): Vector3 {
    return new Vector3(
      this.object3D.position.x + this.startSpeed * Math.cos(this.startAngle * this.degToRad) * Math.cos(this.horizontalAngle * this.degToRad) * this.step
      - (this.airResistance / this.weight * this.startSpeed * this.startSpeed * Math.cos(this.startAngle * this.degToRad) * Math.cos(this.horizontalAngle * this.degToRad) / 2) * Math.pow(this.step, 2),
      this.object3D.position.y + this.startSpeed * Math.sin(this.startAngle * this.degToRad) * this.step
      - (9.81 + this.airResistance / this.weight * this.startSpeed * this.startSpeed * Math.sin(this.startAngle * this.degToRad) / 2) * Math.pow(this.step, 2),
      this.object3D.position.z + this.startSpeed * Math.cos(this.startAngle * this.degToRad) * Math.sin(this.horizontalAngle * this.degToRad) * this.step
      - (this.airResistance / this.weight * this.startSpeed * this.startSpeed * Math.cos(this.startAngle * this.degToRad) * Math.sin(this.horizontalAngle * this.degToRad) / 2) * Math.pow(this.step, 2),
    );
  }

  newAngle(nextPosition: Vector3): number {
    const deltaXp = nextPosition.x - this.object3D.position.x;
    const deltaY = nextPosition.y - this.object3D.position.y;
    const deltaZ = nextPosition.z - this.object3D.position.z;
    const deltaX = Math.sign(deltaXp) * Math.sqrt(Math.pow(deltaXp, 2) + Math.pow(deltaZ, 2));
    return Math.sign(deltaX) < 0 ? Math.sign(deltaY) * (Math.PI - Math.atan(Math.abs(deltaY / deltaX))) : Math.sign(deltaY) * Math.atan(Math.abs(deltaY / deltaX));
  }

  newSpeed(): number {
    const newVx = this.startSpeed * Math.cos(this.startAngle * this.degToRad) * Math.cos(this.horizontalAngle * this.degToRad)
      - this.airResistance / this.weight * this.startSpeed * this.startSpeed * Math.cos(this.startAngle * this.degToRad) * Math.cos(this.horizontalAngle * this.degToRad) * this.step;

    const newVy = this.startSpeed * Math.sin(this.startAngle * this.degToRad)
      - (9.81 + this.airResistance / this.weight * this.startSpeed * this.startSpeed * Math.sin(this.startAngle * this.degToRad)) * this.step;

    const newVz = this.startSpeed * Math.cos(this.startAngle * this.degToRad) * Math.sin(this.horizontalAngle * this.degToRad)
      - this.airResistance / this.weight * this.startSpeed * this.startSpeed * Math.cos(this.startAngle * this.degToRad) * Math.sin(this.horizontalAngle * this.degToRad) * this.step;

    return Math.sqrt(Math.pow(newVx, 2) + Math.pow(newVy, 2) + Math.pow(newVz, 2));
  }

  move(): void {
    const newPos = this.newPosition();
    this.startAngle = this.newAngle(newPos) / this.degToRad;
    this.startSpeed = this.newSpeed();

    this.object3D.position.set(newPos.x, newPos.y, newPos.z);
  }
}
