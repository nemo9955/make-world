import { WorkerDOM } from "../utils/WorkerDOM";
import { Config, WorkerEvent } from "./Config";
import { DrawWorkerInstance } from "./GenWorkerMetadata";
import { WorldData } from "./WorldData";
import { freeFloat32Array, getFloat32Array, ObjectPool } from "../utils/ObjectPool";

import * as Convert from "../utils/Convert"

import * as d3 from "d3"



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
import { path } from "d3";
import { Object3D } from "three";



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

    hoverSphere: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
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
        const rayThresh = 200;
        this.raycaster.params.Points.threshold = rayThresh; // DRAWUNIT
        this.raycaster.params.Line.threshold = rayThresh; // DRAWUNIT


        // events set in src/modules/EventsManager.ts -> addOrbitCtrlEvents
        this.controls = new OrbitControls(this.camera, this.fakeDOM);
        this.controls.enablePan = false;
        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_); })
        // this.controls.addEventListener("change", this.cameraMoved.bind(this))


        this.fakeDOM.addEventListener("mouseenter", this.hoverEnter.bind(this))
        this.fakeDOM.addEventListener("mousemove", this.hoverMoved.bind(this))
        this.fakeDOM.addEventListener("mouseleave", this.hoverleave.bind(this))
        this.fakeDOM.addEventListener("contextmenu", this.hoverClick.bind(this))

        // this.syncTerrainData();

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



    private hoverData = { mousex: 0, mousey: 0, mousep: { x: null, y: null }, hoverId: 0, selectedId: 0 };
    private hoverMoved(event: any) {
        this.hoverData.mousex = event.offsetX;
        this.hoverData.mousey = event.offsetY;
        this.hoverData.mousep.x = (this.hoverData.mousex / this.canvasOffscreen.width) * 2 - 1;
        this.hoverData.mousep.y = - (this.hoverData.mousey / this.canvasOffscreen.height) * 2 + 1;


        if (this.tpPts)
            if (this.hoverData.mousep.x != null && this.hoverData.mousep.y != null) {
                this.raycaster.setFromCamera(this.hoverData.mousep, this.camera);
                const intersects = this.raycaster.intersectObject(this.tpPts, false);
                if (intersects.length > 0) {
                    var orb_ = intersects[0]
                    this.hoverSphere.visible = true;
                    this.hoverData.hoverId = orb_.index;
                    const vec3pts = this.terrain.vec3pts[this.hoverData.hoverId];
                    this.hoverSphere.position.copy(vec3pts);
                    // console.log("orb_", orb_);
                } else {
                    this.hoverData.hoverId = -1;
                    this.hoverSphere.visible = false;
                }
            }


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
        if (this.specialHoverAction && this.hoverData.hoverId !== -1) {
            this.specialHoverAction(this.hoverData.hoverId);
            this.specialHoverAction = null;
            return;
        }

        if (this.hoverData.hoverId == -1) {
            this.selectedPoints.length = 0;
            this.clearAllLines();
        }
        else
            this.selectedPoints.push(this.hoverData.hoverId)

        console.log("this.selectedPoints", this.selectedPoints);
        // console.log("this.hoverData.hoverId", this.hoverData.hoverId);

        if (this.selectedPoints.length >= 2) {
            const paths = this.terrain.makePaths(this.selectedPoints)
            this.drawLinesPaths(paths);
        }
    }


    private drawLinesPaths(paths: { cost: number; junction: number[]; path: number[]; }[]) {
        var patSegLen = 0;
        for (const path_ of paths)
            patSegLen += path_.path.length;
        patSegLen -= paths.length;


        const vec3pts = this.terrain.vec3pts;
        const segLen = patSegLen * 3 * 2;
        freeFloat32Array(this.tpLines1?.geometry?.getAttribute('position').array as Float32Array);
        const lineSegs = getFloat32Array(segLen);

        var lineCnt = 0;
        for (const path_ of paths) {
            // console.log("path_", path_);
            for (let index = 0; index < path_.path.length - 1; index++) {
                const e1 = path_.path[index];
                const e2 = path_.path[index + 1];
                // console.log("e1,e2", e1, e2);
                lineSegs[lineCnt++] = vec3pts[e1].x;
                lineSegs[lineCnt++] = vec3pts[e1].y;
                lineSegs[lineCnt++] = vec3pts[e1].z;
                lineSegs[lineCnt++] = vec3pts[e2].x;
                lineSegs[lineCnt++] = vec3pts[e2].y;
                lineSegs[lineCnt++] = vec3pts[e2].z;
            }
        }
        this.drawLinesSegments(lineSegs, segLen);
    }




    // ptsGeometry: THREE.BufferGeometry;
    // ptsMaterial: THREE.PointsMaterial;
    // ptsObject: THREE.Points;

    // lineGeometry: THREE.BufferGeometry; // LineSegmentsGeometry or THREE.BufferGeometry
    // lineMaterial: THREE.LineBasicMaterial; // LineMaterial or THREE.LineBasicMaterial
    // lineObject: THREE.LineSegments; // LineSegments2 or THREE.LineSegments


    tpPts: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    tpLines1: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
    rivers: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
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
        ptsObject.material.visible = (this.ptsRadius != 0)

        const ptsPosAttr = new THREE.Float32BufferAttribute(this.terrain.pos3d, 3);
        ptsPosAttr.count = this.terrain.ptsLength;
        // const ptsColAttr = new THREE.Float32BufferAttribute(this.terrain.color, 3);
        const ptsColAttr = new THREE.Float32BufferAttribute(this.terrain.colorDebug, 3);
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

        const attrPos = new THREE.Float32BufferAttribute(meshPos, 3)
        attrPos.count = pts3Vertex.length;
        ptcl.setAttribute('position', attrPos);
        const attrCol = new THREE.Float32BufferAttribute(meshCol, 3)
        attrCol.count = pts3Vertex.length;
        ptcl.setAttribute('color', attrCol);
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

    private clearRivers() {
        this.disposeObj(this.rivers)
    }




    private drawLinesPrede() {

        const vec3pts = this.terrain.vec3pts
        const ptsPred = this.terrain.ptsPred
        const segLen = ptsPred.length * 3 * 2;
        freeFloat32Array(this.tpLines1?.geometry?.getAttribute('position').array as Float32Array)
        const lineSegs = getFloat32Array(segLen);
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

        this.drawLinesSegments(lineSegs, segLen);
    }

    private drawLinesEdge() {

        const vec3pts = this.terrain.vec3pts
        const ptsEdges = this.terrain.ptsEdges
        const segLen = ptsEdges.length * 3 * 2;
        freeFloat32Array(this.tpLines1?.geometry?.getAttribute('position').array as Float32Array)
        const lineSegs = getFloat32Array(segLen);
        for (let index = 0; index < ptsEdges.length; index++) {
            const ed = ptsEdges[index];
            lineSegs[index * 6 + 0] = vec3pts[ed[0]].x;
            lineSegs[index * 6 + 1] = vec3pts[ed[0]].y;
            lineSegs[index * 6 + 2] = vec3pts[ed[0]].z;
            lineSegs[index * 6 + 3] = vec3pts[ed[1]].x;
            lineSegs[index * 6 + 4] = vec3pts[ed[1]].y;
            lineSegs[index * 6 + 5] = vec3pts[ed[1]].z;
        }

        this.drawLinesSegments(lineSegs, segLen);
    }




    private drawLinesSegments(lineSegs: Float32Array, lineSegsLen: number) {
        this.clearAllLines()


        // console.log("lineSegsLen,lineSegs", lineSegsLen, lineSegs);

        // if (lineSegs)
        //     for (let index = 0; index < lineSegsLen; index++)
        //         lineSegs[index] *= (Math.random() / 30) + 1
        // if (lineSegs)
        for (let index = 0; index < lineSegsLen; index++)
            lineSegs[index] *= 1.01

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
        line1PosAttr.count = lineSegsLen / 3;
        line1Geometry.setAttribute('position', line1PosAttr);
        line1Geometry.computeBoundingSphere();
        var line1Object = new THREE.LineSegments(line1Geometry, line1Material);


        this.tpLines1 = line1Object;
        this.scene.add(line1Object);
    }

    private drawRivers(lineSegs: Float32Array, lineSegsLen: number) {
        this.clearRivers()


        // console.log("lineSegsLen,lineSegs", lineSegsLen, lineSegs);

        // if (lineSegs)
        //     for (let index = 0; index < lineSegsLen; index++)
        //         lineSegs[index] *= (Math.random() / 30) + 1
        // if (lineSegs)
        for (let index = 0; index < lineSegsLen; index++)
            lineSegs[index] *= 1.01

        var riversGeometry = new THREE.BufferGeometry();
        var riversMaterial = new THREE.LineBasicMaterial({
            color: 0x07cdf5,
            linewidth: 1, // not working :(
            // vertexColors: true,
        });

        // const edges = new THREE.EdgesGeometry(ptcl);
        // var line1Object = new THREE.LineSegments(edges, line1Material);

        // const line1PosAttr = new THREE.Float32BufferAttribute(this.terrain.linesHull, 3);
        const riversPosAttr = new THREE.Float32BufferAttribute(lineSegs, 3);
        riversPosAttr.count = lineSegsLen / 3;
        riversGeometry.setAttribute('position', riversPosAttr);
        riversGeometry.computeBoundingSphere();
        var riversObject = new THREE.LineSegments(riversGeometry, riversMaterial);


        this.rivers = riversObject;
        this.scene.add(riversObject);
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
        this.scanRivers();
        // this.pathToWater();
        console.timeEnd(`#time DrawThreeTerrain updateDeep`);
    }

    draw(): void {
        // console.log(`#HERELINE DrawThreeTerrain draw `);


        this.renderer.render(this.scene, this.camera);
    }


    public updatePtsMaterials() {
        this.tpPts.material.visible = (this.ptsRadius != 0)
        this.tpPts.material.size = this.ptsRadius;
        this.tpPts.material.needsUpdate = true;
    }

    private drawLinesSegmentsIndex(lineIndex: Float32Array, lineIndexLen: number) {
        const vec3pts = this.terrain.vec3pts;
        const segLen = lineIndexLen * 3;
        freeFloat32Array(this.tpLines1?.geometry?.getAttribute('position').array as Float32Array);
        const lineSegs = getFloat32Array(segLen);
        var lineCnt = 0;
        for (let index = 0; index < lineIndexLen; index++) {
            const e1 = lineIndex[index];
            lineSegs[lineCnt++] = vec3pts[e1].x;
            lineSegs[lineCnt++] = vec3pts[e1].y;
            lineSegs[lineCnt++] = vec3pts[e1].z;
        }
        this.drawLinesSegments(lineSegs, segLen);
    }

    private scanLand(index: number) {
        var scanData = this.terrain.scanLand(index);
        this.drawLinesSegmentsIndex(scanData.edgesArr, scanData.edgesLen);
    }

    private scanWater(index: number) {
        var scanData = this.terrain.scanWater(index);
        this.drawLinesSegmentsIndex(scanData.edgesArr, scanData.edgesLen);
    }

    private scanLower(index: number) {
        const elev = this.terrain.elevation[index]
        var scanData = this.terrain.getLowestElevPoints(elev);
        this.drawLinesSegmentsIndex(scanData.edgesArr, scanData.edgesLen);
    }

    private scanHigher(index: number) {
        const elev = this.terrain.elevation[index]
        var scanData = this.terrain.getHighestElevPoints(elev);
        this.drawLinesSegmentsIndex(scanData.edgesArr, scanData.edgesLen);
    }

    private scanOcean() {
        var scanData = this.terrain.getLowestElevPoints(this.terrain.elevOcean);
        this.drawLinesSegmentsIndex(scanData.edgesArr, scanData.edgesLen);
    }

    private scanContinent() {
        var scanData = this.terrain.getHighestElevPoints(this.terrain.elevOcean);
        this.drawLinesSegmentsIndex(scanData.edgesArr, scanData.edgesLen);
    }

    private scanMountains() {
        var scanData = this.terrain.getHighestElevPoints(this.terrain.elevMountain);
        this.drawLinesSegmentsIndex(scanData.edgesArr, scanData.edgesLen);
    }

    private scanRivers() {
        var scanData = this.terrain.getRiverOrig();

        const vec3pts = this.terrain.vec3pts;
        const segLen = scanData.edgesLen * 3;
        freeFloat32Array(this.rivers?.geometry?.getAttribute('position').array as Float32Array);
        const lineSegs = getFloat32Array(segLen);
        var lineCnt = 0;
        for (let index = 0; index < scanData.edgesLen; index++) {
            const e1 = scanData.edgesArr[index];
            lineSegs[lineCnt++] = vec3pts[e1].x;
            lineSegs[lineCnt++] = vec3pts[e1].y;
            lineSegs[lineCnt++] = vec3pts[e1].z;
        }
        this.drawRivers(lineSegs, segLen);
    }


    private pathToWater() {
        const edgesArr = getFloat32Array(this.terrain.ptsEdges.length * 2).fill(-1);
        var edgesLen = 0;
        for (let index = 0; index < this.terrain.ptsEdges.length; index++) {
            const tow = this.terrain.pathToWatter[index];
            if (tow == -1) continue;
            if (isNaN(tow)) continue;
            edgesArr[edgesLen++] = index;
            edgesArr[edgesLen++] = tow;
        }
        // console.log("edgesArr", edgesArr);
        this.drawLinesSegmentsIndex(edgesArr, edgesLen);
    }



    specialHoverAction: any = null;
    public addJgui(jData: jguiData): void {

        var threeDrawTab = jData.jGui.addColapse("Three Draw", true)


        var [butLand, butWat] = threeDrawTab.add2Buttons("Zone land", "Zone Water")
        butLand.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
            this.specialHoverAction = this.scanLand.bind(this);
        })
        butWat.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
            this.specialHoverAction = this.scanWater.bind(this);
        })

        var [butLow, butOcean] = threeDrawTab.add2Buttons("Scan low", "Scan ocean")
        butLow.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
            this.specialHoverAction = this.scanLower.bind(this);
        })
        butOcean.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
            this.scanOcean();
        })

        var [butHii, butLand] = threeDrawTab.add2Buttons("Scan hi", "Scan land")
        butHii.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
            this.specialHoverAction = this.scanHigher.bind(this);
        })
        butLand.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
            this.scanContinent();
        })

        var [butriv, butMtn] = threeDrawTab.add2Buttons("Scan river", "Scan mtn")
        butriv.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
            this.scanRivers();
        })
        butMtn.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
            this.scanMountains();
        })


        threeDrawTab.addSlider("THREE Points size", 0, 1000, 1, this.ptsRadius)
            .addEventListener(jData.jMng, "input", (event: WorkerEvent) => {
                this.ptsRadius = event.data.event.target.valueAsNumber;
                this.updatePtsMaterials();
            })


        const lineTypes = ["none", "edges", "allRivers"]
        // lineTypes.push("predecesor")
        var [_, prdDropList] = threeDrawTab.addDropdown("View lines", lineTypes)
        for (const prjDdObj of prdDropList) {
            prjDdObj.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
                switch (event.data.event.extra.listValue) {
                    case "none": this.clearAllLines(); break;
                    case "edges": this.drawLinesEdge(); break;
                    case "allRivers": this.pathToWater(); break;
                    case "predecesor": this.drawLinesPrede(); break;
                }
            })
        }

    }




}