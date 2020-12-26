
import { WorldData } from "./WorldData"
import { DrawWorker } from "./DrawWorker"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { Config } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"

export function make_camera(width_: number, height_: number) {
    var camera = new THREE.PerspectiveCamera(75, width_ / height_, 0.1, 1000000000000);
    // camera.position.y = 3;
    camera.position.y = Convert.auToKm(3);
    // camera.position.y = Convert.auToKm(50);
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

    orbits: THREE.Line[] = []
    planets: THREE.Object3D[] = []

    hab_zone: THREE.Mesh;
    frost_zone: THREE.Mesh;

    constructor() {
        this.config = null;
        this.world = null;
        this.manager = null;
    }

    public init() {
        console.debug("#HERELINE DrawWorld init ");

        this.scene = new THREE.Scene();
        this.camera = make_camera(this.config.innerWidth, this.config.innerHeight);

        // this.renderer = new THREE.WebGLRenderer();
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasOffscreen,
            antialias: true,
            logarithmicDepthBuffer: true,
        });
        // this.renderer.setSize(this.config.innerWidth, this.config.innerHeight);
        // document.body.appendChild(this.renderer.domElement);


        var ambcolo = 0.2
        const light_am = new THREE.AmbientLight(new THREE.Color(ambcolo, ambcolo, ambcolo)); // soft white light
        this.scene.add(light_am);

        var ptlicolo = 0.1
        const light_pt = new THREE.PointLight(new THREE.Color(ptlicolo, ptlicolo, ptlicolo), 10, Convert.auToKm(800));
        var ptltpos = Convert.auToKm(50);
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

        // for (let rev_ = 0; rev_ < 1; rev_ += 0.05) {
        //     var true_rev = Convert.true_anomaly_rev(rev_, 0.5)
        //     console.log("rev_, true_rev", rev_.toFixed(4), true_rev.toFixed(4));
        // }


    }


    public update() {
        console.debug("#HERELINE DrawWorld update WorldDataID ", this.config.WorldDataID);
        var sun_color = this.world.planetary_system.star.color.getRgb().formatHex();
        (this.sun.material as THREE.MeshStandardMaterial).color.set(sun_color)

        // make sun bigger just because
        this.sun.geometry = new THREE.SphereGeometry(this.world.planetary_system.star.diameter.km * 10, 5, 5);
        // this.earth.geometry = new THREE.SphereGeometry(this.world.planetary_system.star.diameter.km * 20, 5, 5);

        this.hab_zone.geometry = new THREE.RingGeometry(
            this.world.planetary_system.hab_zone_in.km,
            this.world.planetary_system.hab_zone_out.km,
            15, 1);

        this.frost_zone.geometry = new THREE.RingGeometry(
            this.world.planetary_system.frost_line.km,
            this.world.planetary_system.orbits_limit_out.km,
            15, 1);

        for (let index = 0; index < this.orbits.length; index++) {
            const orbit_ = this.orbits[index];
            orbit_.visible = false
        }
        for (let index = 0; index < this.planets.length; index++) {
            const planet_ = this.planets[index];
            planet_.visible = false
        }

        for (let index = 0; index < this.world.planetary_system.orbits_distances.length; index++) {
            const orb_dist = this.world.planetary_system.orbits_distances[index];

            if (this.orbits.length < index + 1) {
                const geometry = new THREE.BufferGeometry()
                const material = new THREE.LineBasicMaterial({ color: 0xffffff });
                const orbit_ = new THREE.Line(geometry, material);
                orbit_.visible = false;
                this.orbits.push(orbit_);
                this.scene.add(orbit_);
            }

            if (this.planets.length < index + 1) {
                const pl_ = new THREE.Mesh(
                    new THREE.SphereGeometry(100000, 5, 5),
                    new THREE.MeshStandardMaterial({ color: new THREE.Color(0.0, 0.6, 0.0) })
                );
                this.planets.push(pl_)
                this.scene.add(pl_);
                pl_.visible = false;
            }

            const orbit_ = this.orbits[index]
            orbit_.visible = true
            orbit_.rotation.set(0, 0, 0)
            orbit_.rotation.x = Convert.degToRad(-90)
            orbit_.rotation.z = orb_dist.longitude_perihelion.rad

            // orbit_.rotation.y = orb_dist.longitude_ascending_node.rad
            // orbit_.rotateX(orb_dist.inclination.rad)

            orbit_.rotation.y = orb_dist.inclination.rad
            orbit_.rotateOnWorldAxis(this._yAxis, orb_dist.longitude_ascending_node.rad)

            const curve = new THREE.EllipseCurve(
                -orb_dist.focal_distance.km, 0,            // ax, aY
                orb_dist.semimajor_axis.km, orb_dist.semiminor_axis.km,           // xRadius, yRadius
                0, 2 * Math.PI,  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
            );
            const points = curve.getPoints(50);
            orbit_.geometry.setFromPoints(points);
            orbit_.userData = curve

            const planet_ = this.planets[index] as THREE.Mesh
            planet_.visible = true
            planet_.rotation.set(0, 0, 0)

            // TODO TMP WA set the planet size so it is easy to see, not realist .....
            var visible_planet_size = curve.getLength() / 35
            // var visible_planet_size = Math.sqrt(curve.getLength()) * 1000
            // var visible_planet_size = Math.sqrt(curve.getLength())*100
            // var visible_planet_size = 70000 * Math.pow((index + 3) * 1.4, 3)
            planet_.geometry = new THREE.SphereGeometry(visible_planet_size, 5, 5);
            planet_.userData = orbit_



            // (orbit_.material as THREE.LineBasicMaterial).color.set(0xffffff * Math.random())
        }


    }

    _xAxis = new THREE.Vector3(1, 0, 0);
    _yAxis = new THREE.Vector3(0, 1, 0);
    _zAxis = new THREE.Vector3(0, 0, 1);
    tmpv3 = new THREE.Vector3(0, 0, 0);
    tmpv2 = new THREE.Vector2(0, 0);

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

        this.stime += 1000000 * 10;


        for (let index = 0; index < this.planets.length; index++) {
            const planet_ = this.planets[index];
            var pl_orb_crv = (planet_.userData.userData as THREE.EllipseCurve)

            var orb_len = pl_orb_crv.getLength()
            var time_orb = this.stime % orb_len
            var time_orb_proc = time_orb / orb_len

            var orb_obj = this.world.planetary_system.orbits_distances[index]
            var true_theta = Convert.true_anomaly_rev(time_orb_proc, orb_obj.eccentricity)


            pl_orb_crv.getPoint(true_theta, this.tmpv2)
            this.tmpv3.set(this.tmpv2.x, this.tmpv2.y, 0)
            planet_.userData.localToWorld(this.tmpv3)
            planet_.position.copy(this.tmpv3)
            planet_.rotation.y += 0.1;
        }



        // console.log("this.stime", this.stime);
        // var someorb = this.orbits[3]
        // var somepl = (someorb.userData as THREE.EllipseCurve)

        // somepl.getPoint(this.stime, this.tmpv2)
        // somepl.getPoint(this.stime, this.tmpv2)
        // somepl.getPointAt(this.stime, this.tmpv2)

        // console.log("someorb", someorb);
        // console.log("this.tmpv2", this.tmpv2);

        // this.tmpv3.set(this.tmpv2.x, this.tmpv2.y, 0)

        // someorb.localToWorld(this.tmpv3)

        // this.earth.position.copy(this.tmpv3)


        // this.earth.position.x = this.world.planetary_system.hab_zone.km * Math.sin(Convert.degToRad(this.stime));
        // this.earth.position.z = this.world.planetary_system.hab_zone.km * Math.cos(Convert.degToRad(this.stime));

        // this.sun.rotation.y += 0.3;
        // this.earth.rotation.y -= 0.2;

        this.renderer.render(this.scene, this.camera);


    }



}