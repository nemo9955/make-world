
import { WorldData } from "./WorldData"
import { DrawWorker } from "./DrawWorker"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { Config } from "./Config"
import * as Convert from "../utils/Convert"

export function make_camera(w, h) {
    var camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.y = 3;
    camera.lookAt(0, 0, 0)
    return camera
}

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
    sun: THREE.Mesh;
    earth: THREE.Mesh;
    // ellipse: THREE.Object3D;
    orbits: THREE.Line[] = []

    hab_zone: THREE.Mesh;
    frost_zone: THREE.Mesh;

    constructor() { }

    public init() {

        this.scene = new THREE.Scene();
        this.camera = make_camera(this.config.innerWidth, this.config.innerHeight);

        // this.renderer = new THREE.WebGLRenderer();
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasOffscreen });
        // this.renderer.setSize(this.config.innerWidth, this.config.innerHeight);
        // document.body.appendChild(this.renderer.domElement);


        var ambcolo = 0.2
        const light_am = new THREE.AmbientLight(new THREE.Color(ambcolo, ambcolo, ambcolo)); // soft white light
        this.scene.add(light_am);

        var ptlicolo = 0.1
        const light_pt = new THREE.PointLight(new THREE.Color(ptlicolo, ptlicolo, ptlicolo), 10, 800);
        var ptltpos = 50;
        light_pt.position.set(-ptltpos, ptltpos, ptltpos);
        this.scene.add(light_pt);



        this.update_not();
    }

    public update_not() {


        this.sun = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 5, 5),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0.6, 0.6, 0.0) })
        );
        this.sun.position.set(0, 0, 0);
        this.scene.add(this.sun);

        this.earth = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 5, 5),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0.0, 0.6, 0.0) })
        );
        this.earth.position.set(0, 0, 5);
        this.scene.add(this.earth);

        const geometry_hab = new THREE.RingGeometry(1, 5, 15, 1);
        const material_hab = new THREE.MeshBasicMaterial({ color: new THREE.Color("green"), side: THREE.DoubleSide });
        material_hab.transparent = true
        material_hab.opacity = 0.2
        this.hab_zone = new THREE.Mesh(geometry_hab, material_hab);
        this.hab_zone.rotateX(Convert.degToRad(-90))
        this.scene.add(this.hab_zone);

        const geometry_fro = new THREE.RingGeometry(10, 50, 15, 1);
        const material_fro = new THREE.MeshBasicMaterial({ color: new THREE.Color("cyan"), side: THREE.DoubleSide });
        material_fro.transparent = true
        material_fro.opacity = 0.1
        this.frost_zone = new THREE.Mesh(geometry_fro, material_fro);
        this.frost_zone.rotateX(Convert.degToRad(-90))
        this.scene.add(this.frost_zone);


        // BIG TODO ... a way for input to reach workers ....
        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);


        // raycaster = new THREE.Raycaster();


        // var curve = new THREE.EllipseCurve(
        //     0, 0,            // ax, aY
        //     4, 5,           // xRadius, yRadius
        //     0, 2 * Math.PI,  // aStartAngle, aEndAngle
        //     false,            // aClockwise
        //     0                 // aRotation
        // );
        // const points = curve.getPoints(50);
        // const geometry = new THREE.BufferGeometry().setFromPoints(points);
        // const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        // // Create the final object to add to the scene
        // this.ellipse = new THREE.Line(geometry, material);
        // this.ellipse.rotateX(Convert.degToRad(90))
        // this.ellipse.use
        // this.scene.add(this.ellipse);
        // this.ellipse.hi



        // var arr = [1,2,2,3,4]
        // var test_sel = d3.selectAll("").data(arr)
        // console.log("test_sel", test_sel);


    }


    public update() {
        // console.log("#HERELINE DrawWorld 118 ");
        var sun_color = this.world.planetary_system.star.color.getRgb().formatHex();
        (this.sun.material as THREE.MeshStandardMaterial).color.set(sun_color)

        this.sun.geometry = new THREE.SphereGeometry(this.world.planetary_system.star.diameter / 15, 5, 5);


        this.hab_zone.geometry = new THREE.RingGeometry(
            this.world.planetary_system.hab_zone_in,
            this.world.planetary_system.hab_zone_out,
            15, 1);


        this.frost_zone.geometry = new THREE.RingGeometry(
            this.world.planetary_system.frost_line,
            this.world.planetary_system.orbits_limit_out,
            15, 1);



        for (let index = 0; index < this.orbits.length; index++) {
            const orb3d = this.orbits[index];
            orb3d.visible = false
        }

        for (let index = 0; index < this.world.planetary_system.orbits_distances.length; index++) {
            const orb_dist = this.world.planetary_system.orbits_distances[index];
            // console.log("orb_dist", orb_dist);
            if (this.orbits.length < index + 1) {
                const geometry = new THREE.BufferGeometry()
                const material = new THREE.LineBasicMaterial({ color: 0xffffff });
                const orb = new THREE.Line(geometry, material);
                orb.rotateX(Convert.degToRad(90))
                orb.visible = false
                this.orbits.push(orb)
                this.scene.add(orb);
            }

            const orb3d = this.orbits[index]
            orb3d.visible = true


            var orb_size = orb_dist
            const curve = new THREE.EllipseCurve(
                0, 0,            // ax, aY
                orb_size, orb_size,           // xRadius, yRadius
                0, 2 * Math.PI,  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
            );
            const points = curve.getPoints(50);
            orb3d.geometry.setFromPoints(points);

            // (orb3d.material as THREE.LineBasicMaterial).color.set(0xffffff * Math.random())

        }

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

        this.stime += 1.5;

        this.earth.position.x = this.world.planetary_system.hab_zone * Math.sin(Convert.degToRad(this.stime));
        this.earth.position.z = this.world.planetary_system.hab_zone * Math.cos(Convert.degToRad(this.stime));

        // this.sun.rotation.y += 0.3;
        this.earth.rotation.y -= 0.2;

        this.renderer.render(this.scene, this.camera);


    }



}