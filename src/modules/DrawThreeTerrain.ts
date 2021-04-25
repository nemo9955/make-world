import { WorkerDOM } from "../utils/WorkerDOM";
import { Config, WorkerEvent } from "./Config";
import { DrawWorkerInstance } from "./GenWorkerMetadata";
import { WorldData } from "./WorldData";

import * as Convert from "../utils/Convert"

import * as d3 from "d3"
import { geoDelaunay, geoVoronoi, geoContour } from "d3-geo-voronoi"
// node_modules/d3-geo-voronoi/dist/d3-geo-voronoi.js

import * as THREE from "three"; // node_modules/three/build/three.js
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Terrain } from "../generate/Terrain";



export class DrawThreeTerrain implements DrawWorkerInstance {
    type: string;
    world: WorldData;
    canvasOffscreen: OffscreenCanvas;
    config: Config;
    fakeDOM = new WorkerDOM();

    public terrain: Terrain = null;

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;


    hoverSphere: THREE.Mesh;
    raycaster: THREE.Raycaster = new THREE.Raycaster();


    constructor() {

    }


    public init(event: WorkerEvent) {
        this.canvasOffscreen = event.data.canvas;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75,
            this.canvasOffscreen.width / this.canvasOffscreen.height, 0.1, 100000); // DRAWUNIT
        this.camera.position.x = -1000 * 0.9; // DRAWUNIT
        this.camera.position.y = 1000 * 0.9; // DRAWUNIT
        this.camera.lookAt(0, 0, 0)


        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasOffscreen,
            antialias: true,
            logarithmicDepthBuffer: true,
        });
        this.resize(this.canvasOffscreen); // lazy use canvas since params same as Event ...

        var ambcolo = 1
        const light_am = new THREE.AmbientLight(new THREE.Color(ambcolo, ambcolo, ambcolo)); // soft white light
        this.scene.add(light_am);



        const geometryHoverSphere = new THREE.SphereGeometry(1);
        const materialHoverSphere = new THREE.MeshBasicMaterial({ color: new THREE.Color("red"), side: THREE.DoubleSide });
        this.hoverSphere = new THREE.Mesh(geometryHoverSphere, materialHoverSphere);
        this.hoverSphere.scale.setScalar(10)
        this.hoverSphere.visible = false;
        this.scene.add(this.hoverSphere);


        // events set in src/modules/EventsManager.ts -> addOrbitCtrlEvents
        this.controls = new OrbitControls(this.camera, this.fakeDOM);
        this.controls.enablePan = false;
        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_); })
        // this.controls.addEventListener("change", this.cameraMoved.bind(this))
        this.cameraMoved();

        this.fakeDOM.addEventListener("mousemove", this.hoverEnter.bind(this)) // mouseleave
        this.fakeDOM.addEventListener("mousemove", this.hoverMoved.bind(this)) // mouseleave
        this.fakeDOM.addEventListener("mouseleave", this.hoverleave.bind(this)) // mouseleave
        this.fakeDOM.addEventListener("contextmenu", this.hoverClick.bind(this))

        this.initData();
        this.refreshTerrain();

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


    distToTarget = 1;
    private cameraMoved() {
        // this.distToTarget = this.camera.position.distanceTo(this.controls.target)
        // this.distToTarget /= 10 ** 3// DRAWUNIT

        this.raycaster.params.Points.threshold = this.distToTarget * 20; // DRAWUNIT
        this.raycaster.params.Line.threshold = this.distToTarget * 20; // DRAWUNIT
        // this.hoverSphere.scale.setScalar(this.raycaster.params.Line.threshold / 2)
        // console.log("this.camera.position", this.camera.position);
    }


    private canvasSelectionData = { mousex: 0, mousey: 0, mousep: { x: null, y: null }, hoverId: 0, selectedId: 0 };
    private hoverMoved(event: any) {
        this.canvasSelectionData.mousex = event.offsetX;
        this.canvasSelectionData.mousey = event.offsetY;
        this.canvasSelectionData.mousep.x = (this.canvasSelectionData.mousex / this.canvasOffscreen.width) * 2 - 1;
        this.canvasSelectionData.mousep.y = - (this.canvasSelectionData.mousey / this.canvasOffscreen.height) * 2 + 1;
    }

    private hoverEnter(event: any) {
        this.hoverMoved(event)
    }
    private hoverleave(event: any) {
        this.canvasSelectionData.mousep.x = null;
        this.canvasSelectionData.mousep.y = null;
    }
    private hoverClick(event: any) {
    }

    ptsGeometry: THREE.BufferGeometry;
    ptsMaterial: THREE.PointsMaterial;
    ptsObject: THREE.Points;

    lineGeometry: THREE.BufferGeometry;
    lineMaterial: THREE.LineBasicMaterial;
    lineObject: THREE.LineSegments;

    public initData() {
        console.debug(`#HERELINE DrawThreeTerrain 116 `);


        this.ptsGeometry = new THREE.BufferGeometry();
        this.ptsMaterial = new THREE.PointsMaterial({
            size: 10,
            // sizeAttenuation: false,
            vertexColors: true,
        });
        this.ptsObject = new THREE.Points(this.ptsGeometry, this.ptsMaterial);
        this.scene.add(this.ptsObject);

        // this.lineGeometry = new THREE.BufferGeometry();
        // this.lineMaterial = new THREE.LineBasicMaterial({
        //     linewidth: 5,
        // });
        // this.lineObject = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
        // this.scene.add(this.lineObject);
    }


    public refreshTerrain() {
        console.debug(`#HERELINE DrawThreeTerrain 130 `);

        const ptsPosAttr = new THREE.Float32BufferAttribute(this.terrain.ptsCart, 3);
        const ptsColAttr = new THREE.Float32BufferAttribute(this.terrain.ptsColor, 3);

        this.ptsGeometry.setAttribute('position', ptsPosAttr);
        this.ptsGeometry.setAttribute('color', ptsColAttr);
        this.ptsGeometry.computeBoundingSphere();

        // const linePosAttr = new THREE.Float32BufferAttribute(this.terrain.ptsLines, 3);
        // this.lineGeometry.setAttribute('position', linePosAttr);
        // this.lineGeometry.computeBoundingSphere();


        // console.log("this.terrain.ptsCart", this.terrain.ptsCart);
        // console.log("posAttr", posAttr);
        // console.log("this.terrain.ptsColor", this.terrain.ptsColor);
        // console.log("colAttr", colAttr);

    }



    updateShallow(): void {
    }

    updateDeep(): void {
    }

    draw(): void {
        // console.log(`#HERELINE DrawThreeTerrain draw `);

        if (this.canvasSelectionData.mousep.x != null && this.canvasSelectionData.mousep.y != null) {
            this.raycaster.setFromCamera(this.canvasSelectionData.mousep, this.camera);
            const intersects = this.raycaster.intersectObjects([this.ptsObject], false);

            if (intersects.length > 0) {
                var orb_ = intersects[0]
                this.hoverSphere.visible = true;
                this.hoverSphere.position.copy(orb_.point)
            } else {
                this.hoverSphere.visible = false;
            }
        }




        this.renderer.render(this.scene, this.camera);
    }

}