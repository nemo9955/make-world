
import { WorldData } from "./WorldData"
import { DrawWorkerInstance } from "./GenWorkerMetadata"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { Config, WorkerEvent } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"


import { ObjectPool } from "../utils/ObjectPool";
import { Orbit } from "../generate/Orbit";
import { Planet } from "../generate/Planet";
import { Star } from "../generate/Star";
import { WorkerDOM } from "../utils/WorkerDOM";
import { OrbitingElement } from "../generate/OrbitingElement";
import { SpaceGroup } from "../generate/SpaceGroup";
import { PlanetarySystem } from "../generate/PlanetarySystem";
import { jguiData, setTempContainer } from "../gui/JguiUtils";
import { JguiMake, JguiManager } from "../gui/JguiMake";

// https://orbitalmechanics.info/


// TODO use bigger length unit to draw so number are smaller
// TOTO give some love to the Stars light and ambiant light

type ThreeUserData = {
    orbLine?: THREE.Object3D,
    orbLineGr?: THREE.Group,
    orbEllipseCurve?: THREE.EllipseCurve,
    sphereMesh?: THREE.Mesh,
    sphereMeshGr?: THREE.Group,
    genericGr?: THREE.Group,
    orbitingElement: OrbitingElement,
    parent: THREE.Object3D,
}


export class DrawThreePlsys implements DrawWorkerInstance {
    public readonly type = this.constructor.name;
    world: WorldData = null;
    config: Config = null;
    canvasOffscreen: OffscreenCanvas = null;
    fakeDOM = new WorkerDOM();

    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    geometry: THREE.BufferGeometry;
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

    _xAxis = new THREE.Vector3(1, 0, 0);
    _yAxis = new THREE.Vector3(0, 1, 0);
    _zAxis = new THREE.Vector3(0, 0, 1);
    tmpv3 = new THREE.Vector3(0, 0, 0);
    tmpv3_1 = new THREE.Vector3(0, 0, 0);
    tmpv3_2 = new THREE.Vector3(0, 0, 0);
    tmpv2 = new THREE.Vector2(0, 0);

    selectedPrevPos = new THREE.Vector3(0, 0, 0);
    orbElemToGroup = new Map<OrbitingElement, any>();
    hoverSphere: THREE.Mesh;
    lastSelectedId: number = 0;
    selectedThing: THREE.Object3D = null;

    constructor() {
        this.raycaster.params.Line.threshold = 10; // DRAWUNIT

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
                new THREE.MeshStandardMaterial()
            );
            // item.material.transparent = true
            // item.material.opacity = 0.5
            item.visible = false;
            return item;
        }, (item) => {
            // console.log("item THREE.Mesh", item);
            item.material = new THREE.MeshStandardMaterial();
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


    public resize(event_: any) {
        // console.debug("#HERELINE DrawThreePlsys resize", event_);
        this.canvasOffscreen.width = event_.width
        this.canvasOffscreen.height = event_.height
        this.fakeDOM.clientWidth = event_.width
        this.fakeDOM.clientHeight = event_.height

        this.camera.aspect = event_.width / event_.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(event_.width, event_.height, false)
    }


    public init(event: WorkerEvent) {
        this.canvasOffscreen = event.data.canvas;
        console.debug(`#HERELINE ${this.type} init `);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75,
            this.canvasOffscreen.width / this.canvasOffscreen.height, 0.1, 10000000000); // DRAWUNIT
        this.camera.position.y = Convert.auToGm(4); // DRAWUNIT
        // this.camera.position.y = Convert.auToGm(40);
        // this.camera.position.y = Convert.auToGm(50);
        // this.camera.position.y = Convert.auToGm(80);
        this.camera.lookAt(0, 0, 0)


        const geometryHoverSphere = new THREE.SphereGeometry(1);
        const materialHoverSphere = new THREE.MeshBasicMaterial({ color: new THREE.Color("red"), side: THREE.DoubleSide });
        // materialHoverSphere.transparent = true;
        // materialHoverSphere.opacity = 0.5;
        this.hoverSphere = new THREE.Mesh(geometryHoverSphere, materialHoverSphere);
        this.hoverSphere.visible = false;
        this.scene.add(this.hoverSphere);


        // events set in src/modules/EventsManager.ts -> addOrbitCtrlEvents
        this.controls = new OrbitControls(this.camera, this.fakeDOM);
        this.controls.enablePan = false;
        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_); })
        this.controls.addEventListener("change", this.cameraMoved.bind(this))
        this.cameraMoved();

        this.fakeDOM.addEventListener("mousemove", this.hoverMoved.bind(this)) // mouseleave
        this.fakeDOM.addEventListener("contextmenu", this.hoverClick.bind(this))


        this.tjs_pool_lines.expand(20);
        this.tjs_pool_orbobjects.expand(20);
        this.tjs_pool_groups.expand(50);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasOffscreen,
            antialias: true,
            logarithmicDepthBuffer: true,
        });
        this.resize(this.canvasOffscreen); // lazy use canvas since params same as Event ...

        var ambcolo = 0.8
        const light_am = new THREE.AmbientLight(new THREE.Color(ambcolo, ambcolo, ambcolo)); // soft white light
        this.scene.add(light_am);

        // this.sun = new THREE.Mesh(
        //     new THREE.SphereGeometry(1, 5, 5),
        //     new THREE.MeshStandardMaterial({ color: new THREE.Color(0.6, 0.6, 0.0) })
        // );
        // this.sun.position.set(0, 0, 0);
        // this.scene.add(this.sun);

        const geometry_hab = new THREE.RingGeometry(1, 5, 50, 1);
        const material_hab = new THREE.MeshBasicMaterial({ color: new THREE.Color("green"), side: THREE.DoubleSide });
        material_hab.transparent = true
        material_hab.opacity = 0.3
        this.hab_zone = new THREE.Mesh(geometry_hab, material_hab);
        this.hab_zone.rotateX(Convert.degToRad(-90))
        this.hab_zone.position.y = -10 // DRAWUNIT
        this.scene.add(this.hab_zone);

        const geometry_fro = new THREE.RingGeometry(10, 50, 50, 1);
        const material_fro = new THREE.MeshBasicMaterial({ color: new THREE.Color("cyan"), side: THREE.DoubleSide });
        material_fro.transparent = true
        material_fro.opacity = 0.1
        this.frost_zone = new THREE.Mesh(geometry_fro, material_fro);
        this.frost_zone.rotateX(Convert.degToRad(-90))
        this.frost_zone.position.y = -10 // DRAWUNIT
        this.scene.add(this.frost_zone);
        console.log("this.world", this.world);
    }

    distToTarget = 0;
    private cameraMoved() {
        this.distToTarget = this.camera.position.distanceTo(this.controls.target)
        this.distToTarget /= 10 ** 3// DRAWUNIT

        this.raycaster.params.Line.threshold = this.distToTarget * 20; // DRAWUNIT
        this.hoverSphere.scale.setScalar(this.raycaster.params.Line.threshold / 2)
        // console.log("this.camera.position", this.camera.position);
    }



    private canvasSelectionData = { mousex: 0, mousey: 0, hoverId: 0, selectedId: 0 };
    private hoverMoved(event: any) {
        this.canvasSelectionData.mousex = event.offsetX;
        this.canvasSelectionData.mousey = event.offsetY;
        // var rect = canvas.getBoundingClientRect();
        // this.canvasSelectionData.mousex = event.clientX - rect.left;
        // this.canvasSelectionData.mousey = event.clientY - rect.top;
        // console.log("event", event);
        // console.log("this.canvasSelectionData", this.canvasSelectionData);
    }


    public workerJguiManager: JguiManager = null;
    worker: Worker = null;

    private hoverClick(event: any) {
        if (this.canvasSelectionData.selectedId !== this.canvasSelectionData.hoverId) {
            this.canvasSelectionData.selectedId = this.canvasSelectionData.hoverId;
            // var selected = mngr.world.idObjMap.get(this.canvasSelectionData.hoverId)
            // mngr.gui.selectOrbElement(selected as OrbitingElement);

            var selOrbElem = this.world.idObjMap.get(this.canvasSelectionData.selectedId) as OrbitingElement;

            if (selOrbElem) {
                var tempJgui = new JguiMake(null).mkContainer()

                // tempJgui.addButton("genStartingPlanetSystem")
                //     .addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
                //         console.log(`!!!!!!!!!!!!!!!!!!`);
                //     })

                var jData: jguiData = {
                    jgui: tempJgui,
                    jguiMng: this.workerJguiManager,
                }

                selOrbElem.addToJgui(jData)


                setTempContainer(this.worker, tempJgui)
            }
        }
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



        var orbEllipseCurve_ = new THREE.EllipseCurve(  // DRAWUNIT
            // 0, 0, //// at the center of the ellipse
            -orbitingElement_.focal_distance.Gm * 1, 0, //// correct focus placement, consideting 0 rotation is at periapsis
            orbitingElement_.semimajor_axis.Gm, orbitingElement_.semiminor_axis.Gm,           // xRadius, yRadius
            0, 2 * Math.PI,  // aStartAngle, aEndAngle
            false,           // aClockwise
            0                // aRotation
        );

        var pointsResolution = 100;
        // if (orbitingElement_.semiminor_axis.value > this.world.planetarySystem.frost_line.value)
        pointsResolution = 200;

        const points: any[] = orbEllipseCurve_.getPoints(pointsResolution);
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
        this.tmpv3_2.y += 100 // DRAWUNIT
        orbLineGr_.lookAt(this.tmpv3_2)
        ////////// orbline_gr_.rotateOnWorldAxis(this._yAxis, Convert.degToRad(90)); // put 0deg of argument_of_perihelion in the right starting place
        orbLineGr_.rotateZ(Convert.degToRad(90)); // put 0deg of argument_of_perihelion in the right starting place
        ////////// orbline_gr_.rotateOnWorldAxis(this._zAxis, orb_dist.argument_of_perihelion.rad);
        orbLineGr_.rotateZ(orbitingElement_.argument_of_perihelion.rad);
        // orbline_gr_.rotateOnWorldAxis(this._zAxis, orb_dist.inclination.rad);
        orbLineGr_.rotateY(orbitingElement_.inclination.rad);
        // orbline_gr_.rotateOnWorldAxis(this._yAxis, orb_dist.longitude_ascending_node.rad)
        orbLineGr_.rotateZ(orbitingElement_.longitude_ascending_node.rad); // not working with rotateY(orb_dist.inclination.rad)


        // var orb_len = orbEllipseCurve_.getLength()
        // var ellPerim1 = orbitingElement_.calcPerimeter1()
        // var ellPerim2 = orbitingElement_.calcPerimeter2()
        // var ellPerim3 = orbitingElement_.calcPerimeter3()
        // console.log("orb_len, ellPerim1, ellPerim2, ellPerim3", orb_len, ellPerim1, ellPerim2, ellPerim3);

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


        // console.log("orbitingElement_.radius.Gm", orbitingElement_.radius.Gm);
        this.updatePlanet(orbitingElement_, sphereMesh_);

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

    public updatePlanet(orbitingElement_: Planet, sphereMesh_: THREE.Mesh) {
        var planetColor = orbitingElement_.color.getRgb().formatHex();
        (sphereMesh_.material as THREE.MeshStandardMaterial).color.set(planetColor)

        var visible_planet_size = orbitingElement_.radius.Gm * 2; // DRAWUNIT


        // TODO TMP to see planets better  // DRAWUNIT but not really
        if (orbitingElement_.radius.km < 3000)
            visible_planet_size = 3;
        else if (orbitingElement_.radius.km < 15000)
            visible_planet_size = 5;
        else if (orbitingElement_.radius.km < 40000)
            visible_planet_size = 10;
        else
            visible_planet_size = 15;

        // var parentOrbit = orbitingElement_.getParentOrbit();
        // if (parentOrbit) {
        //     var parentOrbGr = this.orbElemToGroup.get(parentOrbit);
        //     var parentOrbUserData = (parentOrbGr.userData as ThreeUserData);
        //     var orbEllipseCurve_ = parentOrbUserData.orbEllipseCurve
        //     visible_planet_size = orbEllipseCurve_.getLength() / 50;
        // }


        // TODO TMP WA set the planet size so it is easy to see, not realist .....
        // if (orbitingElement_.orbit.depth == 1) visible_planet_size = orbEllipseCurve_.getLength() / 200;
        // console.log("orb_dist , radius.value", (orb_dist as Planet).radius.value, orb_dist);
        // visible_planet_size *= (orb_dist as Planet).radius.value
        // (sphereMesh_.material as THREE.MeshStandardMaterial).color.setRGB(0.0, 0.6, 0.0);

        // var visible_planet_size = Math.sqrt(ellipse_.getLength()) * 1000
        // var visible_planet_size = Math.sqrt(ellipse_.getLength())*100
        // var visible_planet_size = 70000 * Math.pow((index + 3) * 1.4, 3)
        // planet_.geometry = new THREE.SphereGeometry(visible_planet_size, 5, 5);
        // planet_.geometry.scale(visible_planet_size, visible_planet_size, visible_planet_size)
        sphereMesh_.scale.setScalar(visible_planet_size)


    }

    public handleStar(element_: Star, parent_: THREE.Object3D, root_: THREE.Object3D) {
        const sphereMesh_ = this.tjs_pool_orbobjects.get()
        const sphereMeshGr_ = this.tjs_pool_groups.get()
        var orbitingElement_ = element_;

        this.orb_planets.push(sphereMesh_);
        this.satelits_gr.push(sphereMeshGr_);
        sphereMesh_.visible = true
        sphereMeshGr_.visible = true

        const light_pt = new THREE.PointLight();
        light_pt.color.set("white")

        sphereMesh_.material = new THREE.MeshBasicMaterial()


        var all_obj: ThreeUserData = {
            sphereMesh: sphereMesh_,
            sphereMeshGr: sphereMeshGr_,
            parent: parent_,
            orbitingElement: orbitingElement_,
        };
        sphereMeshGr_.userData = all_obj

        sphereMeshGr_.add(sphereMesh_)
        sphereMeshGr_.add(light_pt);
        root_.add(sphereMeshGr_)

        this.updateStar(orbitingElement_, sphereMesh_);

        sphereMesh_.rotation.set(0, 0, 0)
        sphereMesh_.position.set(0, 0, 0)

        sphereMeshGr_.position.set(0, 0, 0)
        sphereMeshGr_.rotation.set(0, 0, 0)

        return sphereMeshGr_;
    }



    public updateStar(orbitingElement_: Star, sphereMesh_: THREE.Mesh) {
        var sun_color = orbitingElement_.color.getRgb().formatHex();
        (sphereMesh_.material as THREE.MeshBasicMaterial).color.set(sun_color);

        // (sphereMesh_.material as THREE.MeshStandardMaterial).emissive.set("white");
        // (sphereMesh_.material as THREE.MeshStandardMaterial).emissive.set(sun_emit);
        // (sphereMesh_.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
        // for (const ch_ of sphereMesh_.parent.children)
        //     if (ch_ instanceof THREE.PointLight) {
        //         var stltPoint = ch_ as THREE.PointLight;
        //         // stltPoint.color.set(sun_color)
        //         stltPoint.color.set("white")
        //         // stltPoint.intensity
        //         // const stltIntens = 15;
        //         // const stltDist = 100; // DRAWUNIT
        //         // const stltDecay = 1; // for physically correct lights, should be 2.
        //         // console.log("stltPoint", stltPoint);
        //     }

        // make sun bigger just because
        // this.sun.geometry.scale(sun_size,sun_size,sun_size)
        // this.sun.geometry = new THREE.SphereGeometry(sun_size, 5, 5);
        // this.sun.scale.set(sun_size, sun_size, sun_size)
        var visible_planet_size = orbitingElement_.radius.Gm * 2 * 10 // DRAWUNIT

        // var visible_planet_size = Math.sqrt(ellipse_.getLength()) * 1000
        // var visible_planet_size = Math.sqrt(ellipse_.getLength())*100
        // var visible_planet_size = 70000 * Math.pow((index + 3) * 1.4, 3)
        // planet_.geometry = new THREE.SphereGeometry(visible_planet_size, 5, 5);
        // planet_.geometry.scale(visible_planet_size, visible_planet_size, visible_planet_size)
        sphereMesh_.scale.setScalar(visible_planet_size);
    }

    public handleGenericElement(element_: OrbitingElement, parent_: THREE.Object3D, root_: THREE.Object3D) {
        const genericGr_ = this.tjs_pool_groups.get()
        var all_obj: ThreeUserData = {
            genericGr: genericGr_,
            parent: parent_,
            orbitingElement: element_,
        };
        genericGr_.userData = all_obj
        root_.add(genericGr_)
        genericGr_.rotation.set(0, 0, 0)
        genericGr_.position.set(0, 0, 0)
        return genericGr_;
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
                case "SpaceGroup":
                case "PlanetarySystem":
                    elementGr = this.handleGenericElement(orbitingElement_, parent_, root_); break;
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
        // console.debug("#HERELINE "+this.type+" 143 ");
        console.time(`#time ${this.type} updateDeep`);

        this.hab_zone.geometry = new THREE.RingGeometry( // DRAWUNIT
            this.world.planetarySystem.hab_zone_in.Gm,
            this.world.planetarySystem.hab_zone_out.Gm,
            50, 1);

        this.frost_zone.geometry = new THREE.RingGeometry( // DRAWUNIT
            this.world.planetarySystem.frost_line.Gm,
            this.world.planetarySystem.orbits_limit_out.Gm,
            50, 1);


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

        this.popOrbits([this.world.planetarySystem], this.scene, this.scene)
        // this.popOrbits(this.world.planetary_system.getSats(), this.scene, this.scene)

        console.timeEnd((`#time ${this.type} updateDeep`));
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
            var orbLine_ = parentOrbUserData.orbLine

            // var orb_len = orbEllipseCurve_.getLength()
            // var orb_len = parentOrbit.perimeter.Gm // DRAWUNIT
            var orb_per = parentOrbit.orbitalPeriod
            var time_orb = this.world.planetarySystem.time.ey % orb_per.ey
            var time_orb_proc = time_orb / orb_per.ey
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


    public updateShallow() {

        for (const iterator of this.orbElemToGroup.values()) {
            // this.calculatePos(iterator);

            var userData = (iterator.userData as ThreeUserData)
            var orbitingElement_ = userData.orbitingElement

            if (orbitingElement_ instanceof Star) {
                var sphereMesh_ = userData.sphereMesh
                this.updateStar(orbitingElement_, sphereMesh_)
            } else if (orbitingElement_ instanceof Planet) {
                var sphereMesh_ = userData.sphereMesh
                this.updatePlanet(orbitingElement_, sphereMesh_)
            }
        }

    }

    public draw() {
        // console.debug("#HERELINE "+this.type+" draw ", this.world.planetary_system.time.ey);
        this.updateShallow();

        if (this.selectedThing) {
            this.selectedPrevPos.copy(this.selectedThing.position)
        }

        for (const iterator of this.orbElemToGroup.values()) {
            this.calculatePos(iterator);
        }

        this.hoverSphere.visible = false;
        if (this.config.follow_pointed_orbit !== "none") {
            if (this.canvasSelectionData.mousex != 0 && this.canvasSelectionData.mousey != 0) {
                this.mouse.x = (this.canvasSelectionData.mousex / this.canvasOffscreen.width) * 2 - 1;
                this.mouse.y = - (this.canvasSelectionData.mousey / this.canvasOffscreen.height) * 2 + 1;
                // console.log("this.mouse", this.mouse);

                // var allIntersect = [...this.orb_lines, ...this.orb_planets]
                // const intersects = this.raycaster.intersectObjects(allIntersect, false);
                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObjects(this.scene.children, true);
                if (intersects.length > 0) {
                    var orb_ = intersects[0]
                    var targ_ = orb_.object.parent.userData as ThreeUserData
                    if (targ_?.orbitingElement?.id) {
                        this.hoverSphere.visible = true;
                        this.hoverSphere.position.copy(orb_.point)
                        this.canvasSelectionData.hoverId = targ_.orbitingElement.id
                    }
                    // console.log("targ_", targ_);
                    // this.camera.lookAt(targ_.position)
                    // this.controls.target = targ_.position
                    // TODO set a shared data variable with the ID of the selected/focused WORLD thing (orbit,planet,cell,etc.)
                } else {
                    this.canvasSelectionData.hoverId = null;
                }
            }
        }


        if (this.selectedThing) {
            this.selectedPrevPos.sub(this.selectedThing.position);//reuse Vec3 for delta
            this.camera.position.sub(this.selectedPrevPos);
            // this.camera.lookAt(this.selectedThing.position)
            this.selectedPrevPos.copy(this.selectedThing.position);
        }

        // https://stackoverflow.com/questions/37482231/camera-position-changes-in-three-orbitcontrols-in-three-js
        // https://stackoverflow.com/questions/53292145/forcing-orbitcontrols-to-navigate-around-a-moving-object-almost-working
        // https://github.com/mrdoob/three.js/pull/16374#issuecomment-489773834

        if (this.lastSelectedId != this.canvasSelectionData.selectedId) {
            this.lastSelectedId = this.canvasSelectionData.selectedId;
            // console.log("this.lastSelectedId", this.lastSelectedId);
            var selOrbElem = this.world.idObjMap.get(this.lastSelectedId) as OrbitingElement
            if (selOrbElem) {
                var fosusElem = selOrbElem;
                if (this.config.follow_pointed_orbit === "auto") {
                    var firstSat = selOrbElem.getSatIndex(0) // better focuss on Sat
                    if (firstSat && selOrbElem instanceof Orbit) fosusElem = firstSat; // better focuss on Sat
                }
                var orbElemGr = this.orbElemToGroup.get(fosusElem) as THREE.Object3D;
                // console.log("orbElemGr", orbElemGr);
                this.selectedThing = orbElemGr;
                this.controls.target = orbElemGr.position
                this.camera.lookAt(orbElemGr.position)
                // orbElemGr.add(this.camera)
            } else {
                this.selectedThing = null;
                this.controls.target = this.scene.position;
                this.camera.lookAt(this.scene.position)
                // this.scene.add(this.camera)
            }
            this.cameraMoved();
        }

        this.renderer.render(this.scene, this.camera);
    }
}