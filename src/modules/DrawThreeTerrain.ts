import { WorkerDOM } from "../utils/WorkerDOM";
import { Config, WorkerEvent } from "./Config";
import { DrawWorkerInstance } from "./GenWorkerMetadata";
import { WorldData } from "./WorldData";

import * as Convert from "../utils/Convert"

import * as d3 from "d3"
import { geoDelaunay, geoVoronoi, geoContour } from "d3-geo-voronoi"
// node_modules/d3-geo-voronoi/dist/d3-geo-voronoi.js



// Would be nice to have THICKER lines
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_lines_fat.html
// import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2"
// import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry"
// import { LineMaterial } from "three/examples/jsm/lines/LineMaterial"

import * as THREE from "three"; // node_modules/three/build/three.js
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Terrain } from "../generate/Terrain";
import { JguiMake, JguiManager } from "../gui/JguiMake";
import { jguiData } from "../gui/JguiUtils";



export class DrawThreeTerrain implements DrawWorkerInstance {
    type: string;
    world: WorldData;
    canvasOffscreen: OffscreenCanvas;
    config: Config;
    fakeDOM = new WorkerDOM();


    ptsRadius: number = 320;

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
            this.canvasOffscreen.width / this.canvasOffscreen.height, 0.1, 1000000);
        this.setCamera();


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

        this.syncTerrainData();

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

    // ptsGeometry: THREE.BufferGeometry;
    // ptsMaterial: THREE.PointsMaterial;
    // ptsObject: THREE.Points;

    // lineGeometry: THREE.BufferGeometry; // LineSegmentsGeometry or THREE.BufferGeometry
    // lineMaterial: THREE.LineBasicMaterial; // LineMaterial or THREE.LineBasicMaterial
    // lineObject: THREE.LineSegments; // LineSegments2 or THREE.LineSegments


    public terrData = {
        tpPts: new Map<number, THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>(),
        tpLines1: new Map<number, THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>>(),
    };

    public syncTerrainData() {

        for (const tkpl of this.terrain.tkplates) {

            if (this.terrData.tpPts.has(tkpl.id) == false) {
                var ptsGeometry = new THREE.BufferGeometry();
                var ptsMaterial = new THREE.PointsMaterial({
                    size: this.ptsRadius,
                    // sizeAttenuation: false,
                    vertexColors: true,
                });
                var ptsObject = new THREE.Points(ptsGeometry, ptsMaterial);

                const ptsPosAttr = new THREE.Float32BufferAttribute(tkpl.position, 3);
                const ptsColAttr = new THREE.Float32BufferAttribute(tkpl.color, 3);

                ptsGeometry.setAttribute('position', ptsPosAttr);
                ptsGeometry.setAttribute('color', ptsColAttr);
                ptsGeometry.computeBoundingSphere();

                this.terrData.tpPts.set(tkpl.id, ptsObject)

                this.scene.add(ptsObject);
            }

            if (this.terrData.tpLines1.has(tkpl.id) == false) {
                var line1Geometry = new THREE.BufferGeometry();
                var line1Material = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    linewidth: 50, // not working :(
                    // vertexColors: true,
                });
                var line1Object = new THREE.LineSegments(line1Geometry, line1Material);
                const line1PosAttr = new THREE.Float32BufferAttribute(tkpl.lines1, 3);

                line1Geometry.setAttribute('position', line1PosAttr);
                line1Geometry.computeBoundingSphere();

                this.terrData.tpLines1.set(tkpl.id, line1Object)

                this.scene.add(line1Object);
            }

        }


    }


    public clearTerrainData() {
        for (const ptsObj of this.terrData.tpPts.values()) {
            this.scene.remove(ptsObj);
            ptsObj.material.dispose();
            ptsObj.geometry.dispose();
        }
        this.terrData.tpPts.clear();

        for (const line1Obj of this.terrData.tpLines1.values()) {
            this.scene.remove(line1Obj);
            line1Obj.material.dispose();
            line1Obj.geometry.dispose();
        }
        this.terrData.tpLines1.clear();
    }

    updateShallow(): void {
    }

    setCamera(): void {
        this.camera.position.x = this.terrain.tData.sphereSize * 2.2; // DRAWUNIT
        this.camera.position.y = 0;
        this.camera.position.z = 0;
        this.camera.lookAt(0, 0, 0)
    }

    updateDeep(): void {
        console.time(`#time DrawThreeTerrain updateDeep`);
        this.setCamera();
        this.clearTerrainData();
        this.syncTerrainData();
        console.timeEnd(`#time DrawThreeTerrain updateDeep`);
    }

    draw(): void {
        // console.log(`#HERELINE DrawThreeTerrain draw `);

        // if (this.canvasSelectionData.mousep.x != null && this.canvasSelectionData.mousep.y != null) {
        //     this.raycaster.setFromCamera(this.canvasSelectionData.mousep, this.camera);
        //     const intersects = this.raycaster.intersectObjects([this.ptsObject], false);
        //     if (intersects.length > 0) {
        //         var orb_ = intersects[0]
        //         this.hoverSphere.visible = true;
        //         this.hoverSphere.position.copy(orb_.point)
        //     } else {
        //         this.hoverSphere.visible = false;
        //     }
        // }




        this.renderer.render(this.scene, this.camera);
    }


    public updatePtsMaterials() {
        for (const ptsObj of this.terrData.tpPts.values()) {
            ptsObj.material.visible = (this.ptsRadius != 0)
            ptsObj.material.size = this.ptsRadius;
            ptsObj.material.needsUpdate = true;
        }
    }


    public addJgui(jData: jguiData): void {

        jData.jGui.addSlider("THREE Points size", 0, 500, 1, this.ptsRadius)
            .addEventListener(jData.jMng, "input", (event: WorkerEvent) => {
                this.ptsRadius = Number.parseFloat(event.data.event.target.value);
                this.updatePtsMaterials();
            })


    }




    // public initData() {
    //     console.debug(`#HERELINE DrawThreeTerrain 116 `);
    //     this.ptsGeometry = new THREE.BufferGeometry();
    //     this.ptsMaterial = new THREE.PointsMaterial({
    //         size: 50,
    //         // sizeAttenuation: false,
    //         vertexColors: true,
    //     });
    //     this.ptsObject = new THREE.Points(this.ptsGeometry, this.ptsMaterial);
    //     this.lineGeometry = new THREE.BufferGeometry();
    //     this.lineMaterial = new THREE.LineBasicMaterial({
    //         color: 0xffffff,
    //         linewidth: 50,
    //     });
    //     this.lineObject = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    //     // this.lineObject.scale.set( 1, 1, 1 );
    //     this.scene.add(this.ptsObject);
    //     this.scene.add(this.lineObject);
    // }
    // public refreshTerrain() {
    //     console.debug(`#HERELINE DrawThreeTerrain 130 `);
    //     const ptsPosAttr = new THREE.Float32BufferAttribute(this.terrain.ptsCart, 3);
    //     const ptsColAttr = new THREE.Float32BufferAttribute(this.terrain.ptsColor, 3);
    //     this.ptsGeometry.setAttribute('position', ptsPosAttr);
    //     this.ptsGeometry.setAttribute('color', ptsColAttr);
    //     this.ptsGeometry.computeBoundingSphere();
    //     const linePosAttr = new THREE.Float32BufferAttribute(this.terrain.ptsLines, 3);
    //     this.lineGeometry.setAttribute('position', linePosAttr);
    //     // this.lineGeometry.setPositions(this.terrain.ptsLines);
    //     this.lineGeometry.computeBoundingSphere();
    //     // console.log("this.terrain.ptsCart", this.terrain.ptsCart);
    //     // console.log("posAttr", posAttr);
    //     // console.log("this.terrain.ptsColor", this.terrain.ptsColor);
    //     // console.log("colAttr", colAttr);

    // }


}