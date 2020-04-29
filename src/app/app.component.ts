import { Component, HostListener, OnInit } from "@angular/core";
import * as dat from "dat.gui";
import { truncate } from "fs";
import {
  AxesHelper, BoxGeometry, CircleGeometry, Color, CylinderGeometry, Fog, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial,
  PerspectiveCamera, PointLight, Scene, SphereGeometry, Vector3, WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Ball } from "./ball";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.less"]
})
export class AppComponent implements OnInit {
  camera: PerspectiveCamera;
  light: PointLight;
  ground: Mesh;
  orbitControls: OrbitControls;
  renderer: WebGLRenderer;
  scene: Scene;
  axes: AxesHelper;
  webGLOutput: HTMLCanvasElement;

  // используемые переменные
  currentAngle = -Math.PI / 2;
  currentMaxAngle = Math.PI / 2;
  deltaX = 0;
  currentV = 0;
  aDelta = 0;
  Vcoef = 0.00098;
  bool = true;
  // конец

  colors = [
    "brown",
    "bisque",
    "blueviolet",
    "darkorange",
    "darkolivegreen",
    "firebrick",
    "red",
    "orange",
    "yellow",
    "green",
    "blue"];

  controls: {
    startAngle: number;
    horizontalAngle: number;
    startSpeed: number;
    startPosition: Vector3;
    speedRecoveryCoefficient: number;
    airResistance: number;
    timeline: number;
    wallDepth: number;
    wallLength: number;
    wallFar: number;
    ballGeneratingSpeed: number;
  };

  wallControls: {
    aboveGround: number;
    wallFar: number;
    vertAngle: number;
    horizAngle: number;
    LRPosition: number;
  };

  ballRadius: number;
  balls: Ball[];
  ballsIDCounter: number;

  groundInit(): void {
    const circleGeometry = new CircleGeometry(window.innerWidth);
    const circleMaterial = new MeshBasicMaterial({color: 0x838581});
    this.ground = new Mesh(circleGeometry, circleMaterial);
    this.ground.rotation.x = -0.5 * Math.PI;
    this.ground.position.x = 0;
    this.ground.position.y = -5;
    this.ground.position.z = 0;
    this.ground.castShadow = true;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  lightInit(): void {
    this.light = new PointLight(0xADA9A1, 1.7, Infinity);
    this.light.position.set(0, 100, 0);
    // this.light.receiveShadow = true;
    this.light.castShadow = true;
    this.scene.add(this.light);
  }

  orbitControlsInit(): void {
    this.orbitControls.target = new Vector3(-50, 0, 0);
    this.orbitControls.maxPolarAngle = Math.PI / 2;
    this.orbitControls.update();
  }

  resizeRendererToDisplaySize(): boolean {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      this.renderer.setSize(width, height, false);
    }
    return needResize;
  }

  init(): void {
    this.scene = new Scene();
    // this.scene.fog = new Fog(0xCBCBCB, 200, 700);
    this.scene.background = new Color(0xCBCBCB);
    this.camera = new PerspectiveCamera(45,
      window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.x = -50;
    this.camera.position.y = 70;
    this.camera.position.z = 200;
    this.axes = new AxesHelper(1000);
    // this.scene.add(this.axes);
    this.webGLOutput = <HTMLCanvasElement> document.getElementById("WebGL-Output");
    this.renderer = new WebGLRenderer({canvas: this.webGLOutput});
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor(0xEEEEEE);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  animate(): void {
    if (this.resizeRendererToDisplaySize()) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }

    // движение шарика
    const ball = this.scene.getObjectByName("ball");
    ball.position.x = -50 - 45 * Math.sin(this.currentAngle);
    ball.position.y = 50 - 45 * Math.cos(this.currentAngle);


    this.currentAngle += this.aDelta;
    this.deltaX += Math.abs(this.aDelta);
    this.aDelta -= Math.sign(this.currentAngle) * this.Vcoef;
    if (Math.abs(this.currentAngle) <= this.currentMaxAngle) {
      this.bool = true;
    }
    if (this.bool) {

      this.currentV += Math.sign(this.currentAngle) * Math.sqrt(Math.pow(-9.81 * 1.1, 2) + Math.pow(0.1 * 9.81 * Math.cos(this.currentAngle), 2));
      if (Math.abs(this.currentAngle) >= this.currentMaxAngle) {
        this.aDelta = 0;
        // this.aDelta = -this.aDelta;
        this.currentMaxAngle *= 0.9;
        this.Vcoef *= 0.9;
        this.bool = false;
      }
    }
    // конец

    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  randomInteger(min: number, max: number): number {
    const rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  }

  createBall(startSpeed: number,
             startAngle: number,
             horizontalAngle: number,
             startPosition: Vector3,
             speedRecoveryCoefficient: number): void {
    const sphereGeometry = new SphereGeometry(this.ballRadius, 50, 50);
    const sphereMaterial = new MeshPhongMaterial({color: this.colors[5]});
    const sphere = new Mesh(sphereGeometry, sphereMaterial);
    sphere.name = `ball`;
    this.ballsIDCounter += 1;
    sphere.castShadow = true;
    const ball = new Ball(this.ballsIDCounter, this.ballRadius,
      startSpeed, startAngle, startPosition, speedRecoveryCoefficient,
      this.controls.airResistance, sphere, this.scene, horizontalAngle,
      {length: this.controls.wallLength, height: 2, width: this.controls.wallDepth});
    this.scene.add(sphere);
    this.balls.push(ball);
    setTimeout(() => {
      this.balls.splice(this.balls.indexOf(ball), 1);
      this.scene.remove(sphere);
    }, this.controls.ballGeneratingSpeed);
  }

  start(): void {
    this.createBall(this.controls.startSpeed,
      this.controls.startAngle,
      this.controls.horizontalAngle,
      new Vector3(0, 20, 0),
      this.controls.speedRecoveryCoefficient);
  }

  ngOnInit(): void {
    this.init();
    this.lightInit();
    this.orbitControlsInit();

    this.balls = [];
    this.ballsIDCounter = 0;
    this.ballRadius = 5;

    this.controls = {
      startPosition: new Vector3(0, this.ballRadius, 0),
      startAngle: 30,
      horizontalAngle: 0,
      startSpeed: 30,
      speedRecoveryCoefficient: 1,
      airResistance: 0,
      timeline: 0,
      wallDepth: 30,
      wallLength: 25,
      wallFar: 180,
      ballGeneratingSpeed: 6 * 1000,
    };

    this.wallControls = {
      aboveGround: 0,
      wallFar: 40,
      vertAngle: 90,
      horizAngle: 0,
      LRPosition: 0,
    };

    // const startGeometry = new CircleGeometry(5, 50);
    // const startMaterial = new MeshStandardMaterial({color: 0x1E1E1E});
    // const startPoint = new Mesh(startGeometry, startMaterial);
    // startPoint.name = `startPoint`;
    // startPoint.receiveShadow = true;
    // startPoint.rotateX(-Math.PI / 2);
    // startPoint.position.y = -4.9;
    // this.scene.add(startPoint);

    // шарик
    const sphereGeometry = new SphereGeometry(this.ballRadius, 50, 50);
    const sphereMaterial = new MeshStandardMaterial({color: this.colors[5]});
    const sphere = new Mesh(sphereGeometry, sphereMaterial);
    sphere.name = `ball`;
    sphere.position.set(-50, -50, 0);
    this.scene.add(sphere);
    // конец

    const zhelobGeomtry = new CylinderGeometry(50, 50, 50, 50, 50, true, Math.PI / 2, Math.PI);
    const zhelobMaterial = new MeshStandardMaterial({color: this.colors[6], wireframe: true});
    const zhelob = new Mesh(zhelobGeomtry, zhelobMaterial);
    zhelob.rotateX(-Math.PI / 2);
    zhelob.position.y = 50;
    zhelob.position.x = -50;
    this.scene.add(zhelob)
    // this.start();
    // setInterval(() => {
    //   this.balls.forEach((ball) => {
    //     ball.collision(new Vector3(wall.position.x - 2, wall.position.y - this.controls.wallLength, wall.position.z - this.controls.wallDepth),
    //       new Vector3(wall.position.x + 2, wall.position.y + this.controls.wallLength, wall.position.z + this.controls.wallDepth));
    //     ball.animate();
    //   });
    // }, 100);

    this.renderer.render(this.scene, this.camera);
    this.animate();
  }
}
