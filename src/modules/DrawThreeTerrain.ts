import { WorkerDOM } from "../utils/WorkerDOM";
import { Config, WorkerEvent } from "./Config";
import { DrawWorkerInstance } from "./GenWorkerMetadata";
import { WorldData } from "./WorldData";
import { freeFloat32Array, getFloat32Array, ObjectPool } from "../utils/ObjectPool";

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


    ptsRadius: number = 0;

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
        this.hoverSphere.scale.setScalar(100)
        this.hoverSphere.visible = false;
        this.scene.add(this.hoverSphere);
        this.raycaster.params.Points.threshold = 100; // DRAWUNIT
        this.raycaster.params.Line.threshold = 100; // DRAWUNIT


        // events set in src/modules/EventsManager.ts -> addOrbitCtrlEvents
        this.controls = new OrbitControls(this.camera, this.fakeDOM);
        this.controls.enablePan = false;
        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_); })
        // this.controls.addEventListener("change", this.cameraMoved.bind(this))


        this.fakeDOM.addEventListener("mouseenter", this.hoverEnter.bind(this))
        this.fakeDOM.addEventListener("mousemove", this.hoverMoved.bind(this))
        this.fakeDOM.addEventListener("mouseleave", this.hoverleave.bind(this))
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



    private canvasSelectionData = { mousex: 0, mousey: 0, mousep: { x: null, y: null }, hoverId: 0, selectedId: 0 };
    private hoverMoved(event: any) {
        this.canvasSelectionData.mousex = event.offsetX;
        this.canvasSelectionData.mousey = event.offsetY;
        this.canvasSelectionData.mousep.x = (this.canvasSelectionData.mousex / this.canvasOffscreen.width) * 2 - 1;
        this.canvasSelectionData.mousep.y = - (this.canvasSelectionData.mousey / this.canvasOffscreen.height) * 2 + 1;


        // if (this.canvasSelectionData.mousep.x != null && this.canvasSelectionData.mousep.y != null) {
        //     this.raycaster.setFromCamera(this.canvasSelectionData.mousep, this.camera);
        //     // const intersects = this.raycaster.intersectObjects([...this.tpMesh.values()], false);
        //     // const intersects = this.raycaster.intersectObjects([...this.tpPts.values()], false);
        //     const ptsObj = this.tpPts.get(this.terrain.id);
        //     const intersects = this.raycaster.intersectObject(this.tpPts.get(this.terrain.id), false);
        //     if (intersects.length > 0) {
        //         var orb_ = intersects[0]
        //         this.hoverSphere.visible = true;
        //         this.hoverSphere.position.copy(orb_.point)
        //         console.log("orb_", orb_);
        //     } else {
        //         this.hoverSphere.visible = false;
        //     }
        // }


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


    tpPts: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    tpLines1: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
    tpMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;

    public syncTerrainData() {
        this.drawMeshTerrain();
        this.drawPoints();
    }

    private drawPoints() {
        this.clearAllPoints();


        var ptsGeometry = new THREE.BufferGeometry();
        var ptsMaterial = new THREE.PointsMaterial({
            size: this.ptsRadius,
            // sizeAttenuation: false,
            vertexColors: true,
        });
        var ptsObject = new THREE.Points(ptsGeometry, ptsMaterial);

        const ptsPosAttr = new THREE.Float32BufferAttribute(this.terrain.pos3d, 3);
        ptsPosAttr.count = this.terrain.ptsLength;
        const ptsColAttr = new THREE.Float32BufferAttribute(this.terrain.color, 3);
        ptsColAttr.count = this.terrain.ptsLength;

        ptsGeometry.setAttribute('position', ptsPosAttr);
        ptsGeometry.setAttribute('color', ptsColAttr);
        ptsGeometry.computeBoundingSphere();

        this.tpPts = ptsObject;

        this.scene.add(ptsObject);
    }

    private clearAllPoints() {
        this.disposeObj(this.tpPts)
    }

    private drawMeshTerrain() {
        this.clearAllMesh()


        var mesMaterial = new THREE.MeshBasicMaterial({
            // color: 0xffffff,
            // opacity: 0.5,
            // transparent: true,
            vertexColors: true,
        });
        const ptcl = new THREE.BufferGeometry()
        var mesObject = new THREE.Mesh(ptcl, mesMaterial);


        const vec3pts = this.terrain.vec3pts
        const ptsPred = this.terrain.ptsPred
        const color = this.terrain.color
        const pts3Vertex = this.terrain.pts3Vertex

        freeFloat32Array(this.tpMesh?.geometry?.getAttribute('position').array as Float32Array)
        freeFloat32Array(this.tpMesh?.geometry?.getAttribute('color').array as Float32Array)

        const meshPos = getFloat32Array(pts3Vertex.length * 3);
        const meshCol = getFloat32Array(pts3Vertex.length * 3);
        for (let index = 0; index < pts3Vertex.length; index++) {
            meshPos[index * 3 + 0] = vec3pts[pts3Vertex[index]].x
            meshPos[index * 3 + 1] = vec3pts[pts3Vertex[index]].y
            meshPos[index * 3 + 2] = vec3pts[pts3Vertex[index]].z

            meshCol[index * 3 + 0] = color[pts3Vertex[index] * 3 + 0]
            meshCol[index * 3 + 1] = color[pts3Vertex[index] * 3 + 1]
            meshCol[index * 3 + 2] = color[pts3Vertex[index] * 3 + 2]
        }

        ptcl.setAttribute('position', new THREE.Float32BufferAttribute(meshPos, 3));
        ptcl.setAttribute('color', new THREE.Float32BufferAttribute(meshCol, 3));
        // ptcl.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );




        this.tpMesh = mesObject;
        this.scene.add(mesObject);
    }

    private clearAllMesh() {
        this.disposeObj(this.tpMesh)
    }



    private clearAllLines() {
        this.disposeObj(this.tpLines1)
    }




    private drawLinesPrede() {
        this.clearAllLines()

        const vec3pts = this.terrain.vec3pts
        const ptsPred = this.terrain.ptsPred
        freeFloat32Array(this.tpLines1?.geometry?.getAttribute('position').array as Float32Array)
        const lineSegs = getFloat32Array(ptsPred.length * 3 * 2);
        for (let index = 0; index < ptsPred.length - 1; index++) {
            const ed = ptsPred[index];
            if (ed < 0) continue;
            lineSegs[index * 6 + 0] = vec3pts[index].x
            lineSegs[index * 6 + 1] = vec3pts[index].y
            lineSegs[index * 6 + 2] = vec3pts[index].z
            lineSegs[index * 6 + 3] = vec3pts[ed].x
            lineSegs[index * 6 + 4] = vec3pts[ed].y
            lineSegs[index * 6 + 5] = vec3pts[ed].z
        }

        this.drawLinesSegments(lineSegs);
    }

    private drawLinesEdge() {
        this.clearAllLines()

        const vec3pts = this.terrain.vec3pts
        const ptsEdges = this.terrain.ptsEdges
        freeFloat32Array(this.tpLines1?.geometry?.getAttribute('position').array as Float32Array)
        const lineSegs = getFloat32Array(ptsEdges.length * 3 * 2);
        for (let index = 0; index < ptsEdges.length; index++) {
            const ed = ptsEdges[index];
            lineSegs[index * 6 + 0] = vec3pts[ed[0]].x;
            lineSegs[index * 6 + 1] = vec3pts[ed[0]].y;
            lineSegs[index * 6 + 2] = vec3pts[ed[0]].z;
            lineSegs[index * 6 + 3] = vec3pts[ed[1]].x;
            lineSegs[index * 6 + 4] = vec3pts[ed[1]].y;
            lineSegs[index * 6 + 5] = vec3pts[ed[1]].z;
        }

        this.drawLinesSegments(lineSegs);
    }


    private drawLinesSegments(lineSegs: Float32Array) {

        // if (lineSegs)
        //     for (let index = 0; index < lineSegs.length; index++)
        //         lineSegs[index] *= (Math.random() / 30) + 1
        if (lineSegs)
            for (let index = 0; index < lineSegs.length; index++)
                lineSegs[index] *= 1.05

        var line1Geometry = new THREE.BufferGeometry();
        var line1Material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 50, // not working :(
            // vertexColors: true,
        });

        // const edges = new THREE.EdgesGeometry(ptcl);
        // var line1Object = new THREE.LineSegments(edges, line1Material);

        // const line1PosAttr = new THREE.Float32BufferAttribute(this.terrain.linesHull, 3);
        const line1PosAttr = new THREE.Float32BufferAttribute(lineSegs, 3);
        line1Geometry.setAttribute('position', line1PosAttr);
        line1Geometry.computeBoundingSphere();
        var line1Object = new THREE.LineSegments(line1Geometry, line1Material);


        this.tpLines1 = line1Object;
        this.scene.add(line1Object);
    }


    private disposeObj(threeObj: any) {
        if (!threeObj) return;
        this.scene.remove(threeObj);
        threeObj?.material?.dispose();
        threeObj?.geometry?.dispose();
    }

    public clearTerrainData() {
        this.clearAllPoints();
        this.clearAllMesh();
        this.clearAllLines();
    }

    updateShallow(): void {
    }

    setCamera(): void {
        this.camera.position.x = this.terrain.data.sphereSize * 2.2; // DRAWUNIT
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


        this.renderer.render(this.scene, this.camera);
    }


    public updatePtsMaterials() {
        // this.raycaster.params.Points.threshold = this.ptsRadius; // DRAWUNIT
        // this.raycaster.params.Line.threshold = this.ptsRadius; // DRAWUNIT
        this.tpPts.material.visible = (this.ptsRadius != 0)
        this.tpPts.material.size = this.ptsRadius;
        this.tpPts.material.needsUpdate = true;
    }


    public addJgui(jData: jguiData): void {

        var threeDrawTab = jData.jGui.addColapse("Three Draw", true)

        threeDrawTab.addSlider("THREE Points size", 0, 1000, 1, this.ptsRadius)
            .addEventListener(jData.jMng, "input", (event: WorkerEvent) => {
                this.ptsRadius = Number.parseFloat(event.data.event.target.value);
                this.updatePtsMaterials();
            })


        const lineTypes = ["none", "edges", "predecesor"]
        var [_, prdDropList] = threeDrawTab.addDropdown("View lines", lineTypes)
        for (const prjDdObj of prdDropList) {
            prjDdObj.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
                switch (event.data.event.extra.listValue) {
                    case "none": this.clearAllLines(); break;
                    case "edges": this.drawLinesEdge(); break;
                    case "predecesor": this.drawLinesPrede(); break;
                }
            })
        }

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