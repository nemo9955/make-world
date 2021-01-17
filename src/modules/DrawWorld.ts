
import { WorldData } from "./WorldData"
import { DrawWorker } from "./DrawWorker"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { Config } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"


import { ObjectPool } from "../utils/ObjectPool";
import { OrbitingElement, Orbit } from "../generate/Orbit";
import { Planet } from "../generate/Planet";
import { Star } from "../generate/Star";

// https://orbitalmechanics.info/


export function make_camera(width_: number, height_: number) {
    var camera = new THREE.PerspectiveCamera(75, width_ / height_, 0.1, 1000000000000);
    // camera.position.y = 3;
    camera.position.y = Convert.auToKm(4);
    // camera.position.y = Convert.auToKm(40);
    // camera.position.y = Convert.auToKm(50);
    // camera.position.y = Convert.auToKm(60);
    camera.lookAt(0, 0, 0)
    return camera
}

export class DrawWorld {
    world: WorldData;
    canvasOffscreen: any;
    config: Config;

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


    constructor() {
        this.config = null;
        this.world = null;



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

    public init() {
        console.debug("#HERELINE DrawWorld init ");

        this.scene = new THREE.Scene();
        this.camera = make_camera(this.config.innerWidth, this.config.innerHeight);


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










    public update() {
        // console.debug("#HERELINE DrawWorld 143 ");
        console.time("#time DrawWorld update");


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
            this.orb_objects.pop().free();

        this.popOrbits(this.world.planetary_system.satelites, this.scene, this.scene)


        console.timeEnd("#time DrawWorld update");
    }

    _xAxis = new THREE.Vector3(1, 0, 0);
    _yAxis = new THREE.Vector3(0, 1, 0);
    _zAxis = new THREE.Vector3(0, 0, 1);
    tmpv3 = new THREE.Vector3(0, 0, 0);
    tmpv3_1 = new THREE.Vector3(0, 0, 0);
    tmpv3_2 = new THREE.Vector3(0, 0, 0);
    tmpv2 = new THREE.Vector2(0, 0);



    public popOrbits(satelites_: Array<OrbitingElement>, root_: THREE.Object3D, position_root_: THREE.Object3D) {
        for (let index = 0; index < satelites_.length; index++) {
            const orb_dist = satelites_[index];

            orb_dist.orbit.updateMajEcc();
            // if (orb_dist.depth >= 2) continue;

            const orbit_line_ = this.tjs_pool_lines.get()
            const orbobject_ = this.tjs_pool_orbobjects.get()
            const orbline_gr_ = this.tjs_pool_groups.get()
            const orbobj_gr_ = this.tjs_pool_groups.get()

            this.orb_lines.push(orbit_line_);
            this.orb_planets.push(orbobject_);
            this.orb_objects.push(orb_dist)
            this.orb_groups.push(orbline_gr_);
            this.satelits_gr.push(orbobj_gr_);


            // console.log("orb_dist.type", orb_dist.type);

            orbit_line_.visible = true
            orbobject_.visible = false
            orbline_gr_.visible = true
            orbobj_gr_.visible = true







            var ellipse_ = new THREE.EllipseCurve(
                // 0, 0, //// at the center of the ellipse
                -orb_dist.focal_distance.km * 1, 0, //// correct focus placement, consideting 0 rotation is at periapsis
                orb_dist.semimajor_axis.km, orb_dist.semiminor_axis.km,           // xRadius, yRadius
                0, 2 * Math.PI,  // aStartAngle, aEndAngle
                false,           // aClockwise
                0                // aRotation
            );
            const points: any[] = ellipse_.getPoints(50);
            orbit_line_.geometry.setFromPoints(points);


            // TODO TMP WA set the planet size so it is easy to see, not realist .....
            // var visible_planet_size = 100000000
            var visible_planet_size = ellipse_.getLength() / 20;
            if (orb_dist.orbit.depth == 1) visible_planet_size = ellipse_.getLength() / 200;
            if (orb_dist instanceof Planet) {
                orbobject_.visible = true;
                // console.log("orb_dist , radius.value", (orb_dist as Planet).radius.value, orb_dist);
                // visible_planet_size *= (orb_dist as Planet).radius.value
                (orbobject_.material as THREE.MeshStandardMaterial).color.setRGB(0.0, 0.6, 0.0);
                visible_planet_size *= orb_dist.radius.value
            }
            if (orb_dist instanceof Star) {
                orbobject_.visible = true
                // console.debug("#HERELINE DrawWorld update WorldDataID ", this.config.WorldPlanetarySystemID);
                var sun_color = orb_dist.color.getRgb().formatHex();
                (orbobject_.material as THREE.MeshStandardMaterial).color.set(sun_color)

                // make sun bigger just because
                visible_planet_size = orb_dist.radius.km * 2 * 10
                // this.sun.geometry.scale(sun_size,sun_size,sun_size)
                // this.sun.geometry = new THREE.SphereGeometry(sun_size, 5, 5);
                // this.sun.scale.set(sun_size, sun_size, sun_size)

            }

            // var visible_planet_size = Math.sqrt(ellipse_.getLength()) * 1000
            // var visible_planet_size = Math.sqrt(ellipse_.getLength())*100
            // var visible_planet_size = 70000 * Math.pow((index + 3) * 1.4, 3)
            // planet_.geometry = new THREE.SphereGeometry(visible_planet_size, 5, 5);
            // planet_.geometry.scale(visible_planet_size, visible_planet_size, visible_planet_size)
            orbobject_.scale.setScalar(visible_planet_size)




            var all_obj: any = {}
            all_obj.orbit_line = orbit_line_
            all_obj.orbitObject = orbobject_
            all_obj.ellipse = ellipse_
            all_obj.orbline_group = orbline_gr_
            all_obj.satelits = orbobj_gr_
            all_obj.parent = position_root_

            orbit_line_.userData = all_obj
            orbobject_.userData = all_obj
            orbline_gr_.userData = all_obj
            orbobj_gr_.userData = all_obj


            orbobj_gr_.add(orbobject_)
            root_.add(orbobj_gr_)
            orbline_gr_.add(orbit_line_)
            root_.add(orbline_gr_)

            // orbobj_gr_.add(orbobject_)
            // orbline_gr_.add(orbobj_gr_)
            // orbline_gr_.add(orbit_)
            // root_.add(orbline_gr_)


            orbobject_.rotation.set(0, 0, 0)
            orbobject_.position.set(0, 0, 0)

            orbit_line_.rotation.set(0, 0, 0)
            orbit_line_.position.set(0, 0, 0)

            orbline_gr_.position.set(0, 0, 0)
            orbline_gr_.rotation.set(0, 0, 0)

            orbobj_gr_.position.set(0, 0, 0)
            orbobj_gr_.rotation.set(0, 0, 0)




            orbline_gr_.getWorldPosition(this.tmpv3_2)
            this.tmpv3_2.y += 100000000000
            orbline_gr_.lookAt(this.tmpv3_2)

            // console.log("orb_dist.depth", orb_dist.depth);
            // console.log("tmpv3_2 POS", this.tmpv3_2.x.toPrecision(3), this.tmpv3_2.y.toPrecision(3), this.tmpv3_2.z.toPrecision(3));
            // orbline_gr_.getWorldDirection(this.tmpv3_2)
            // this.tmpv3_2.normalize();
            // console.log("tmpv3_2 DIR", this.tmpv3_2.x.toPrecision(3), this.tmpv3_2.y.toPrecision(3), this.tmpv3_2.z.toPrecision(3));





            // if (orb_dist.depth == 2) orbline_gr_.rotateX(Convert.degToRad(90));
            ///////////// orbline_gr_.rotateOnWorldAxis(this._xAxis, Convert.degToRad(-90));
            ///////////// orbline_gr_.rotateX(Convert.degToRad(-90));



            ////////// orbline_gr_.rotateOnWorldAxis(this._yAxis, Convert.degToRad(90)); // put 0deg of argument_of_perihelion in the right starting place
            orbline_gr_.rotateZ(Convert.degToRad(90)); // put 0deg of argument_of_perihelion in the right starting place

            ////////// orbline_gr_.rotateOnWorldAxis(this._zAxis, orb_dist.argument_of_perihelion.rad);
            orbline_gr_.rotateZ(orb_dist.argument_of_perihelion.rad);

            // orbline_gr_.rotateOnWorldAxis(this._zAxis, orb_dist.inclination.rad);
            orbline_gr_.rotateY(orb_dist.inclination.rad);

            // orbline_gr_.rotateOnWorldAxis(this._yAxis, orb_dist.longitude_ascending_node.rad)
            orbline_gr_.rotateZ(orb_dist.longitude_ascending_node.rad); // not working with rotateY(orb_dist.inclination.rad)




            // orbline_gr_.getWorldDirection(this.tmpv3_2)
            // this.tmpv3_2.normalize();
            // console.log("tmpv3_2 DIR", this.tmpv3_2.x.toPrecision(3), this.tmpv3_2.y.toPrecision(3), this.tmpv3_2.z.toPrecision(3));



            // ////// const arrowHelper = new THREE.ArrowHelper(this._xAxis, orbit_.position, visible_planet_size * 10, 0xffff00);
            // ////// orbline_gr_.add(arrowHelper);
            // ////////////// https://threejs.org/docs/#api/en/helpers/AxesHelper
            // const axesHelper = new THREE.AxesHelper(5); // The X axis is red. The Y axis is green. The Z axis is blue.
            // axesHelper.position.copy(orbline_gr_.position)
            // axesHelper.scale.setScalar(visible_planet_size)
            // orbline_gr_.add(axesHelper);



            this.popOrbits(orb_dist.satelites, root_, orbobj_gr_)
            // this.popOrbits(orb_dist.satelites, orbobj_gr_)

            // console.log("orb_dist", orb_dist);
            // (orbit_.material as THREE.LineBasicMaterial).color.set(0xffffff * Math.random())
        }

        // const axesHelper = new THREE.AxesHelper(5); // The X axis is red. The Y axis is green. The Z axis is blue.
        // axesHelper.position.z = 100000000 * 50
        // axesHelper.position.x = 100000000 * 50
        // axesHelper.scale.setScalar(100000000 * 5)
        // this.scene.add(axesHelper);

    }


    public draw() {
        for (let index = 0; index < this.satelits_gr.length; index++) {
            const orbobj_gr_ = this.satelits_gr[index];
            var pl_orb_crv = (orbobj_gr_.userData.ellipse as THREE.EllipseCurve)
            var orb_obj = this.orb_objects[index]

            var orbline_gr_ = (orbobj_gr_.userData.orbline_group as THREE.Group)
            var parent_ = (orbobj_gr_.userData.parent as THREE.Object3D)
            var orbit_line_ = (orbobj_gr_.userData.orbit_line as THREE.Object3D)

            var orb_len = pl_orb_crv.getLength()
            var time_orb = this.world.planetary_system.time.universal % orb_len
            var time_orb_proc = time_orb / orb_len

            time_orb_proc += orb_obj.mean_longitude.rev

            var true_theta = Convert.true_anomaly_rev(time_orb_proc, orb_obj.eccentricity)


            // true_theta = 0 // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

            pl_orb_crv.getPoint(true_theta, this.tmpv2)

            this.tmpv3.set(this.tmpv2.x, this.tmpv2.y, 0)

            orbit_line_.localToWorld(this.tmpv3)

            orbline_gr_.position.copy(parent_.position)
            orbobj_gr_.position.copy(this.tmpv3)
        }

        this.renderer.render(this.scene, this.camera);
    }
}