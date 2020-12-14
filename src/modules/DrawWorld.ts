
import { WorldData } from "./WorldData"
import { DrawWorker } from "./DrawWorker"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"


import { Config } from "./Config"

export class DrawWorld {
    world: WorldData;
    manager: DrawWorker;
    canvasOffscreen: any;
    config: Config;



    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    geometry: THREE.Geometry;
    material: THREE.Material;
    controls: OrbitControls;
    stime = 0
    radius = 4
    sun: THREE.Object3D;
    earth: THREE.Object3D;
    curve: THREE.EllipseCurve;
    ellipse: THREE.Object3D;




    constructor() { }


    public init() {

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.config.innerWidth / this.config.innerHeight, 0.1, 1000);
        this.camera.position.y = 10;
        // camera.position.z = 10;
        this.camera.lookAt(0, 0, 0)


        // this.renderer = new THREE.WebGLRenderer();
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasOffscreen });
        // this.renderer.setSize(this.config.innerWidth, this.config.innerHeight);
        // document.body.appendChild(this.renderer.domElement);



        this.sun = new THREE.Mesh(
            new THREE.SphereGeometry(1, 5, 5),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0.6, 0.6, 0.0) })
        );
        this.sun.position.set(0, 0, 0);
        this.scene.add(this.sun);

        this.earth = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 5, 5),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0.0, 0.6, 0.0) })
        );
        this.earth.position.set(0, 0, 5);
        this.scene.add(this.earth);

        // BIG TODO ... a way for input to reach workers ....
        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        var ambcolo = 0.2
        const light_am = new THREE.AmbientLight(new THREE.Color(ambcolo, ambcolo, ambcolo)); // soft white light
        this.scene.add(light_am);

        var ptlicolo = 0.1
        const light_pt = new THREE.PointLight(new THREE.Color(ptlicolo, ptlicolo, ptlicolo), 10, 800);
        var ptltpos = 50;
        light_pt.position.set(-ptltpos, ptltpos, ptltpos);
        this.scene.add(light_pt);


        // raycaster = new THREE.Raycaster();


        this.curve = new THREE.EllipseCurve(
            0, 0,            // ax, aY
            4, 5,           // xRadius, yRadius
            0, 2 * Math.PI,  // aStartAngle, aEndAngle
            false,            // aClockwise
            0                 // aRotation
        );
        const points = this.curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        // Create the final object to add to the scene
        this.ellipse = new THREE.Line(geometry, material);
        this.ellipse.rotateX(90)
        this.scene.add(this.ellipse);




    }


    public draw() {
        // var canvas_ctx = this.canvasOffscreen.getContext("2d");
        // canvas_ctx.clearRect(0, 0, this.canvasOffscreen.width, this.canvasOffscreen.height);
        // canvas_ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        // canvas_ctx.fillRect(100, 100, 200, 200);
        // canvas_ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        // canvas_ctx.fillRect(150, 150, 200, 200);
        // // console.log("this.world.planetary_system.star.color", this.world.planetary_system.star.color);
        // // console.log("this.world.planetary_system.star", this.world.planetary_system.star);
        // canvas_ctx.fillStyle = this.world.planetary_system.star.color.toString();
        // canvas_ctx.fillRect(50 * Math.random() + 100, 50 * Math.random(), 200, 200);


        // this.controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

        this.stime += 0.5;


        this.earth.position.x = this.radius * Math.sin(THREE.MathUtils.degToRad(this.stime));
        this.earth.position.z = this.radius * Math.cos(THREE.MathUtils.degToRad(this.stime));

        this.sun.rotation.y += 0.3;
        this.earth.rotation.y -= 0.2;

        this.renderer.render(this.scene, this.camera);


    }



}