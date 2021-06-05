import { WorkerDOM } from "../utils/WorkerDOM";
import { Config, WorkerEvent } from "../modules/Config";
import { DrawPageInstance, DrawWorkerInstance } from "../modules/GenWorkerMetadata";
import { WorldData } from "../modules/WorldData";
import { freeFloat32Array, getFloat32Array, ObjectPool } from "../utils/ObjectPool";

import * as Convert from "../utils/Convert"

import * as THREE from "three"; // node_modules/three/build/three.js
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls" // node_modules/three/examples/jsm/controls/OrbitControls.js
import { Terrain } from "../planet/Terrain";
import { JguiMake, JguiManager } from "../gui/JguiMake";
import { jguiData } from "../gui/JguiUtils";
import { path } from "d3";
import { Object3D } from "three";



export class BuildingDrawThree implements DrawPageInstance {
    type: string;
    world: WorldData;
    canvasOffscreen: HTMLCanvasElement;
    config: Config;
    fakeDOM: HTMLElement;



    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;

    hoverSphere: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
    raycaster: THREE.Raycaster = new THREE.Raycaster();

    constructor() {

    }

    init(event: WorkerEvent): void {
        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_ as any); })
        throw new Error("Method not implemented.");
    }

    updateShallow(): void {
        throw new Error("Method not implemented.");
    }

    updateDeep(): void {
        throw new Error("Method not implemented.");
    }

    initPage(canvas: HTMLCanvasElement): void {
        this.canvasOffscreen = canvas;
        this.fakeDOM = canvas;
        // window.addEventListener("resize", (event_) => {
        //     this.resize({
        //         width: window.innerWidth,
        //         height: window.innerHeight
        //     });
        // })

        this.initScene();
    }

    draw(): void {
        this.renderer.setClearColor(0xeeeeee, 1);
        this.renderer.render(this.scene, this.camera);
    }

    addJgui(jData: jguiData): void {
        throw new Error("Method not implemented.");
    }


    initScene() {

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75,
            this.canvasOffscreen.width / this.canvasOffscreen.height, 0.1, 1000000);
        this.setCamera();


        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasOffscreen,
            antialias: true,
            logarithmicDepthBuffer: true,
        });
        this.resize(this.canvasOffscreen); // lazy use canvas since params same as Event ...


        // var ambcolo = 1
        // const light_am = new THREE.AmbientLight(new THREE.Color(ambcolo, ambcolo, ambcolo));
        // this.scene.add(light_am);


        const radius = 10;
        const radials = 12;
        const circles = 6;
        const divisions = 20;

        const helper = new THREE.PolarGridHelper(radius, radials, circles, divisions);
        this.scene.add(helper);


        const geometryHoverSphere = new THREE.SphereGeometry(1);
        const materialHoverSphere = new THREE.MeshBasicMaterial({ color: new THREE.Color("red"), side: THREE.DoubleSide });
        this.hoverSphere = new THREE.Mesh(geometryHoverSphere, materialHoverSphere);
        this.hoverSphere.scale.setScalar(100)
        this.hoverSphere.visible = false;
        this.scene.add(this.hoverSphere);
        const rayThresh = 200;
        this.raycaster.params.Points.threshold = rayThresh; // DRAWUNIT
        this.raycaster.params.Line.threshold = rayThresh; // DRAWUNIT



        // events set in src/modules/EventsManager.ts -> addOrbitCtrlEvents
        this.controls = new OrbitControls(this.camera, this.fakeDOM);
        // this.controls.addEventListener("change", this.cameraMoved.bind(this))
        // this.controls.enablePan = false;
        // this.controls.enableZoom = false;
        this.controls.mouseButtons = { RIGHT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, LEFT: THREE.MOUSE.PAN }


        this.fakeDOM.addEventListener("mouseenter", this.hoverEnter.bind(this))
        this.fakeDOM.addEventListener("mousemove", this.hoverMoved.bind(this))
        this.fakeDOM.addEventListener("mouseleave", this.hoverleave.bind(this))
        this.fakeDOM.addEventListener("click", this.hoverClick.bind(this))
        // this.fakeDOM.addEventListener("contextmenu", this.hoverClick.bind(this))

    }


    setCamera(): void {
        this.camera.position.x = 100 * 2.2; // DRAWUNIT
        this.camera.position.y = 0;
        this.camera.position.z = 0;
        this.camera.lookAt(0, 0, 0)
    }

    public resize(event_: { width: number, height: number }) {
        // console.log("#HERELINE DrawThreePlsys resize", event_);
        this.canvasOffscreen.width = event_.width
        this.canvasOffscreen.height = event_.height

        if (this.fakeDOM instanceof WorkerDOM) {
            this.fakeDOM.clientWidth = event_.width
            this.fakeDOM.clientHeight = event_.height
        }

        this.camera.aspect = event_.width / event_.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(event_.width, event_.height, false)
    }


    private hoverData = { mousex: 0, mousey: 0, mousep: { x: null, y: null }, hoverId: 0, selectedId: 0 };
    private hoverMoved(event: any) {
        this.hoverData.mousex = event.offsetX;
        this.hoverData.mousey = event.offsetY;
        this.hoverData.mousep.x = (this.hoverData.mousex / this.canvasOffscreen.width) * 2 - 1;
        this.hoverData.mousep.y = - (this.hoverData.mousey / this.canvasOffscreen.height) * 2 + 1;
    }
    private hoverEnter(event: any) {
        this.hoverMoved(event)
    }
    private hoverleave(event: any) {
        this.hoverData.mousep.x = null;
        this.hoverData.mousep.y = null;
    }

    selectedPoints: number[] = [];
    private hoverClick(event: any) {
        // console.log("event", event);
    }


}