
import { WorldData } from "./WorldData"
import { DrawWorker } from "./DrawWorker"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { Config } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"


import { ObjectPool } from "../utils/ObjectPool";
import { Orbit } from "../generate/Orbit";
import { Planet } from "../generate/Planet";
import { Star } from "../generate/Star";
import { SharedData } from "./SharedData";
import { WorkerDOM } from "../utils/WorkerDOM";
import { OrbitingElement } from "../generate/OrbitingElement";

// https://orbitalmechanics.info/

export function make_camera(width_: number, height_: number) {
    var camera = new THREE.PerspectiveCamera(75, width_ / height_, 0.1, 1000000000000);
    // camera.position.y = 3;
    camera.position.y = Convert.auToKm(5);
    // camera.position.y = Convert.auToKm(40);
    // camera.position.y = Convert.auToKm(50);
    // camera.position.y = Convert.auToKm(80);
    camera.lookAt(0, 0, 0)
    return camera
}

type ThreeUserData = {
    orbLine?: THREE.Object3D,
    orbLineGr?: THREE.Group,
    orbEllipseCurve?: THREE.EllipseCurve,
    sphereMesh?: any,
    sphereMeshGr?: any,
    orbitingElement: OrbitingElement,
    parent: THREE.Object3D,
}


export class DrawWorld {
    shared_data: SharedData = null;
    world: WorldData;
    canvasOffscreen: any;
    config: Config;



    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    geometry: THREE.Geometry;
    material: THREE.Material;
    controls: OrbitControls;
    // sun: THREE.Mesh;

    orb_lines: THREE.Line[] = []
    orb_planets: THREE.Mesh[] = []
    orb_groups: THREE.Group[] = []
    satelits_gr: THREE.Group[] = []
    orb_objects: OrbitingElement[] = [] // Orbit Planet Sun

    hab_zone: THREE.Mesh;
    frost_zone: THREE.Mesh;

    tjs_pool_lines: ObjectPool<THREE.Line>;
    tjs_pool_orbobjects: ObjectPool<THREE.Mesh>;
    tjs_pool_groups: ObjectPool<THREE.Group>;


    orbElemToGroup = new Map<OrbitingElement, any>();

    _xAxis = new THREE.Vector3(1, 0, 0);
    _yAxis = new THREE.Vector3(0, 1, 0);
    _zAxis = new THREE.Vector3(0, 0, 1);
    tmpv3 = new THREE.Vector3(0, 0, 0);
    tmpv3_1 = new THREE.Vector3(0, 0, 0);
    tmpv3_2 = new THREE.Vector3(0, 0, 0);
    tmpv2 = new THREE.Vector2(0, 0);


    constructor() {
        this.config = null;
        this.world = null;

        this.raycaster.params.Line.threshold = 1000000 * 10;

        this.tjs_pool_lines = new ObjectPool<THREE.Line>(() => {
            const geometry = new THREE.BufferGeometry()
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const item = new THREE.Line(geometry, material);
            item.visible = false;
            return item;
        }, (item) => {
            // console.log("item THREE.Line", item);
            item.visible = false;
            item.scale.setScalar(1);
            item?.parent?.remove(item)
            item.clear()
        }, 0)

        this.tjs_pool_orbobjects = new ObjectPool<THREE.Mesh>(() => {
            const item = new THREE.Mesh(
                new THREE.SphereGeometry(1, 5, 5),
                new THREE.MeshStandardMaterial({ color: new THREE.Color() })
            );
            // item.material.transparent = true
            // item.material.opacity = 0.5
            item.visible = false;
            return item;
        }, (item) => {
            // console.log("item THREE.Mesh", item);
            item.visible = false;
            item.scale.setScalar(1);
            item?.parent?.remove(item)
            item.clear()
        }, 0)

        this.tjs_pool_groups = new ObjectPool<THREE.Group>(() => {
            const item = new THREE.Group();
            item.visible = false;
            return item;
        }, (item) => {
            // console.log("item THREE.Group", item);
            item.visible = false;
            item.scale.setScalar(1);
            item?.parent?.remove(item)
            item.clear()
        }, 0)



    }

    fakeDOM = new WorkerDOM();
    public init() {
        console.debug("#HERELINE DrawWorld init ");

        this.scene = new THREE.Scene();
        this.camera = make_camera(this.config.innerWidth, this.config.innerHeight);

        // events set in src/modules/EventsManager.ts -> addOrbitCtrlEvents
        this.controls = new OrbitControls(this.camera, this.fakeDOM); ////////////////////////////////////

        // this.fakeDOM.addEventListener("keydown", (event_) => {
        //     console.log("!!!!!!!!!! event_", event_);
        //     console.log("!!!!!!!!!! this.camera.position", this.camera.position);
        // })

        // this.fakeDOM.addEventListener("pointerup", (event_) => {
        //     console.log("!!!!!!!!!! this.camera", this.camera.position, this.camera);
        // })

        // console.log("--- this.camera", this.camera);
        // this.controls.addEventListener("change", () => {
        //     console.log("this.camera", this.camera);
        // })

        this.tjs_pool_lines.expand(20);
        this.tjs_pool_orbobjects.expand(20);
        this.tjs_pool_groups.expand(50);

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

        // this.sun = new THREE.Mesh(
        //     new THREE.SphereGeometry(1, 5, 5),
        //     new THREE.MeshStandardMaterial({ color: new THREE.Color(0.6, 0.6, 0.0) })
        // );
        // this.sun.position.set(0, 0, 0);
        // this.scene.add(this.sun);

        const geometry_hab = new THREE.RingGeometry(1, 5, 15, 1);
        const material_hab = new THREE.MeshBasicMaterial({ color: new THREE.Color("green"), side: THREE.DoubleSide });
        material_hab.transparent = true
        material_hab.opacity = 0.3
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

    }



    public handleOrbit(element_: Orbit, parent_: THREE.Object3D, root_: THREE.Object3D) {
        element_.updateMajEcc();
        var orbitingElement_ = element_;


        const orbLine_ = this.tjs_pool_lines.get()
        const orbLineGr_ = this.tjs_pool_groups.get()

        this.orb_lines.push(orbLine_);
        this.orb_groups.push(orbLineGr_);
        orbLine_.visible = true
        orbLineGr_.visible = true



        var orbEllipseCurve_ = new THREE.EllipseCurve(
            // 0, 0, //// at the center of the ellipse
            -orbitingElement_.focal_distance.km * 1, 0, //// correct focus placement, consideting 0 rotation is at periapsis
            orbitingElement_.semimajor_axis.km, orbitingElement_.semiminor_axis.km,           // xRadius, yRadius
            0, 2 * Math.PI,  // aStartAngle, aEndAngle
            false,           // aClockwise
            0                // aRotation
        );
        const points: any[] = orbEllipseCurve_.getPoints(50);
        orbLine_.geometry.setFromPoints(points);

        var all_obj: ThreeUserData = {
            orbLine: orbLine_,
            orbLineGr: orbLineGr_,
            orbEllipseCurve: orbEllipseCurve_,
            parent: parent_,
            orbitingElement: orbitingElement_,
        };
        orbLineGr_.userData = all_obj


        orbLineGr_.add(orbLine_)
        root_.add(orbLineGr_)


        orbLine_.rotation.set(0, 0, 0)
        orbLine_.position.set(0, 0, 0)

        orbLineGr_.position.set(0, 0, 0)
        orbLineGr_.rotation.set(0, 0, 0)


        orbLineGr_.getWorldPosition(this.tmpv3_2)
        this.tmpv3_2.y += 100000000000
        orbLineGr_.lookAt(this.tmpv3_2)
        ////////// orbline_gr_.rotateOnWorldAxis(this._yAxis, Convert.degToRad(90)); // put 0deg of argument_of_perihelion in the right starting place
        orbLineGr_.rotateZ(Convert.degToRad(90)); // put 0deg of argument_of_perihelion in the right starting place
        ////////// orbline_gr_.rotateOnWorldAxis(this._zAxis, orb_dist.argument_of_perihelion.rad);
        orbLineGr_.rotateZ(orbitingElement_.argument_of_perihelion.rad);
        // orbline_gr_.rotateOnWorldAxis(this._zAxis, orb_dist.inclination.rad);
        orbLineGr_.rotateY(orbitingElement_.inclination.rad);
        // orbline_gr_.rotateOnWorldAxis(this._yAxis, orb_dist.longitude_ascending_node.rad)
        orbLineGr_.rotateZ(orbitingElement_.longitude_ascending_node.rad); // not working with rotateY(orb_dist.inclination.rad)



        return orbLineGr_;

    }

    public handlePlanet(element_: Planet, parent_: THREE.Object3D, root_: THREE.Object3D) {
        const sphereMesh_ = this.tjs_pool_orbobjects.get()
        const sphereMeshGr_ = this.tjs_pool_groups.get()
        var orbitingElement_ = element_;

        this.orb_planets.push(sphereMesh_);
        this.satelits_gr.push(sphereMeshGr_);
        sphereMesh_.visible = true
        sphereMeshGr_.visible = true


        var visible_planet_size = 100000000 * 1

        var parentOrbit = orbitingElement_.getParentOrbit();
        if (parentOrbit) {
            var parentOrbGr = this.orbElemToGroup.get(parentOrbit);
            var parentOrbUserData = (parentOrbGr.userData as ThreeUserData);
            var orbEllipseCurve_ = parentOrbUserData.orbEllipseCurve
            visible_planet_size = orbEllipseCurve_.getLength() / 50;
        }

        visible_planet_size *= orbitingElement_.radius.value; // TODO FIXME REMOVE !!!!!!!!!!!!!!!!!!!!!!!!!

        // TODO TMP WA set the planet size so it is easy to see, not realist .....
        // if (orbitingElement_.orbit.depth == 1) visible_planet_size = orbEllipseCurve_.getLength() / 200;
        // console.log("orb_dist , radius.value", (orb_dist as Planet).radius.value, orb_dist);
        // visible_planet_size *= (orb_dist as Planet).radius.value
        (sphereMesh_.material as THREE.MeshStandardMaterial).color.setRGB(0.0, 0.6, 0.0);

        // var visible_planet_size = Math.sqrt(ellipse_.getLength()) * 1000
        // var visible_planet_size = Math.sqrt(ellipse_.getLength())*100
        // var visible_planet_size = 70000 * Math.pow((index + 3) * 1.4, 3)
        // planet_.geometry = new THREE.SphereGeometry(visible_planet_size, 5, 5);
        // planet_.geometry.scale(visible_planet_size, visible_planet_size, visible_planet_size)
        sphereMesh_.scale.setScalar(visible_planet_size)



        var all_obj: ThreeUserData = {
            sphereMesh: sphereMesh_,
            sphereMeshGr: sphereMeshGr_,
            parent: parent_,
            orbitingElement: orbitingElement_,
        };
        sphereMeshGr_.userData = all_obj

        sphereMeshGr_.add(sphereMesh_)
        root_.add(sphereMeshGr_)

        sphereMesh_.rotation.set(0, 0, 0)
        sphereMesh_.position.set(0, 0, 0)

        sphereMeshGr_.position.set(0, 0, 0)
        sphereMeshGr_.rotation.set(0, 0, 0)

        return sphereMeshGr_;
    }

    public handleStar(element_: Star, parent_: THREE.Object3D, root_: THREE.Object3D) {
        const sphereMesh_ = this.tjs_pool_orbobjects.get()
        const sphereMeshGr_ = this.tjs_pool_groups.get()
        var orbitingElement_ = element_;

        this.orb_planets.push(sphereMesh_);
        this.satelits_gr.push(sphereMeshGr_);
        sphereMesh_.visible = true
        sphereMeshGr_.visible = true

        this.updateStar(orbitingElement_, sphereMesh_);

        var all_obj: ThreeUserData = {
            sphereMesh: sphereMesh_,
            sphereMeshGr: sphereMeshGr_,
            parent: parent_,
            orbitingElement: orbitingElement_,
        };
        sphereMeshGr_.userData = all_obj

        sphereMeshGr_.add(sphereMesh_)
        root_.add(sphereMeshGr_)

        sphereMesh_.rotation.set(0, 0, 0)
        sphereMesh_.position.set(0, 0, 0)

        sphereMeshGr_.position.set(0, 0, 0)
        sphereMeshGr_.rotation.set(0, 0, 0)

        return sphereMeshGr_;
    }

    public updateStar(orbitingElement_: Star, sphereMesh_: THREE.Mesh) {
        var visible_planet_size = orbitingElement_.radius.km * 2 * 10
        var sun_color = orbitingElement_.color.getRgb().formatHex();
        (sphereMesh_.material as THREE.MeshStandardMaterial).color.set(sun_color)

        // make sun bigger just because
        // this.sun.geometry.scale(sun_size,sun_size,sun_size)
        // this.sun.geometry = new THREE.SphereGeometry(sun_size, 5, 5);
        // this.sun.scale.set(sun_size, sun_size, sun_size)

        // var visible_planet_size = Math.sqrt(ellipse_.getLength()) * 1000
        // var visible_planet_size = Math.sqrt(ellipse_.getLength())*100
        // var visible_planet_size = 70000 * Math.pow((index + 3) * 1.4, 3)
        // planet_.geometry = new THREE.SphereGeometry(visible_planet_size, 5, 5);
        // planet_.geometry.scale(visible_planet_size, visible_planet_size, visible_planet_size)
        sphereMesh_.scale.setScalar(visible_planet_size);
    }



    public popOrbits(satelites_: Array<OrbitingElement>, parent_: THREE.Object3D, root_: THREE.Object3D) {
        for (let index = 0; index < satelites_.length; index++) {
            const orbitingElement_ = satelites_[index];

            var elementGr: THREE.Group = null;

            switch (orbitingElement_.type) {
                case "Orbit":
                    elementGr = this.handleOrbit(orbitingElement_ as Orbit, parent_, root_); break;
                case "Planet":
                    elementGr = this.handlePlanet(orbitingElement_ as Planet, parent_, root_); break;
                case "Star":
                    elementGr = this.handleStar(orbitingElement_ as Star, parent_, root_); break;
                default:
                    console.error("orbitingElement_", orbitingElement_);
                    throw new Error("NOT IMPLEMENTED !!!!!!!!");
            }

            this.orbElemToGroup.set(orbitingElement_, elementGr)

            this.popOrbits(orbitingElement_.getSats(), elementGr, root_)


            // ////// const arrowHelper = new THREE.ArrowHelper(this._xAxis, orbit_.position, visible_planet_size * 10, 0xffff00);
            // ////// orbline_gr_.add(arrowHelper);
            // ////////////// https://threejs.org/docs/#api/en/helpers/AxesHelper
            // const axesHelper = new THREE.AxesHelper(5); // The X axis is red. The Y axis is green. The Z axis is blue.
            // axesHelper.position.copy(orbline_gr_.position)
            // axesHelper.scale.setScalar(visible_planet_size)
            // orbline_gr_.add(axesHelper);

        }

    }

    public updateDeep() {
        // console.debug("#HERELINE DrawWorld 143 ");
        console.time("#time DrawWorld updateDeep");


        this.hab_zone.geometry = new THREE.RingGeometry(
            this.world.planetary_system.hab_zone_in.km,
            this.world.planetary_system.hab_zone_out.km,
            15, 1);

        this.frost_zone.geometry = new THREE.RingGeometry(
            this.world.planetary_system.frost_line.km,
            this.world.planetary_system.orbits_limit_out.km,
            15, 1);


        while (this.orb_lines.length > 0)
            this.tjs_pool_lines.free(this.orb_lines.pop());
        while (this.orb_planets.length > 0)
            this.tjs_pool_orbobjects.free(this.orb_planets.pop());
        while (this.orb_groups.length > 0)
            this.tjs_pool_groups.free(this.orb_groups.pop());
        while (this.satelits_gr.length > 0)
            this.tjs_pool_groups.free(this.satelits_gr.pop());

        while (this.orb_objects.length > 0)
            this.orb_objects.pop();

        this.orbElemToGroup.clear()

        this.popOrbits(this.world.planetary_system.getSats(), this.scene, this.scene)

        console.timeEnd("#time DrawWorld update");
    }


    private calculatePos(element_: THREE.Object3D) {
        var userData = (element_.userData as ThreeUserData)

        var parent_ = userData.parent
        var orbitingElement_ = userData.orbitingElement

        element_.position.copy(parent_.position)

        var parentOrbit = orbitingElement_.getParentOrbit();

        // console.log("orbitingElement_", orbitingElement_);
        // console.log("parentOrbit", parentOrbit);

        if (parentOrbit) {
            // If on an Orbit, we need to calculate position on it
            var parentOrbGr = this.orbElemToGroup.get(parentOrbit);
            var parentOrbUserData = (parentOrbGr.userData as ThreeUserData);
            var orbEllipseCurve_ = parentOrbUserData.orbEllipseCurve
            var orbLineGr_ = parentOrbUserData.orbLineGr
            var orbLine_ = parentOrbUserData.orbLine

            var orb_len = orbEllipseCurve_.getLength()
            var time_orb = this.world.planetary_system.time.universal % orb_len
            var time_orb_proc = time_orb / orb_len
            time_orb_proc += parentOrbit.mean_longitude.rev
            var true_theta = Convert.true_anomaly_rev(time_orb_proc, parentOrbit.eccentricity)
            // true_theta = 0 // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            orbEllipseCurve_.getPoint(true_theta, this.tmpv2)
            this.tmpv3.set(this.tmpv2.x, this.tmpv2.y, 0)
            orbLine_.localToWorld(this.tmpv3)
            element_.position.copy(this.tmpv3)
        }

        element_.updateMatrixWorld()

    }


    public draw() {
        // console.debug("#HERELINE DrawWorld draw ", this.world.planetary_system.time.universal);

        for (const iterator of this.orbElemToGroup.values()) {
            this.calculatePos(iterator);

            var userData = (iterator.userData as ThreeUserData)
            var orbitingElement_ = userData.orbitingElement

            // TODO dirty way to efficiently keep THREE objects synced with OrbitingElement valueas
            if (orbitingElement_ instanceof Star) {
                var sphereMesh_ = userData.sphereMesh
                this.updateStar(orbitingElement_, sphereMesh_)
           }
        }

        if (this.config.follow_pointed_orbit)
            if (this.shared_data.mousex != 0 && this.shared_data.mousey != 0) {
                this.mouse.x = (this.shared_data.mousex / this.canvasOffscreen.width) * 2 - 1;
                this.mouse.y = - (this.shared_data.mousey / this.canvasOffscreen.height) * 2 + 1;
                // console.log("this.mouse", this.mouse);

                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObjects(this.orb_lines, false);
                // const intersects = this.raycaster.intersectObjects(this.scene.children, true);
                if (intersects.length > 0) {
                    var orb_ = intersects[0]
                    var targ_ = orb_.object.userData.satelites
                    // console.log("orb_", orb_);
                    console.log("targ_", targ_);
                    // this.camera.lookAt(targ_.position)
                    // this.controls.target = targ_.position
                    // TODO set a shared data variable with the ID of the selected/focused WORLD thing (orbit,planet,cell,etc.)
                }

            }

        this.renderer.render(this.scene, this.camera);
    }
}