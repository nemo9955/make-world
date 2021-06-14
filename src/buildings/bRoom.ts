
import * as THREE from "three"; // node_modules/three/build/three.js
import { bBaseObj } from "./bBaseObj";
import { BldConectedRoom, BldRoomType, Building, BuildingJson } from "./Building";
import { degToRad, radToDeg } from "../utils/Convert";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js" // node_modules/three/examples/jsm/helpers/VertexNormalsHelper.js



const raycaster: THREE.Raycaster = new THREE.Raycaster();

const VEC3_UP = new THREE.Vector3(0, 1, 0);
const vec3tmp0 = new THREE.Vector3();
const vec3tmp1 = new THREE.Vector3();
const vec3tmp2 = new THREE.Vector3();
const vec3tmp3 = new THREE.Vector3();
const quattmp1 = new THREE.Quaternion();

export class bRoom extends bBaseObj {
    roomMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
    ptRoom: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;

    constructor() {
        super();
    }

    create(globalJson: BuildingJson, rkey: string) {
        this.name = rkey;
        var rdata = globalJson.rooms[rkey];

        var geomRoom: THREE.BufferGeometry = null;
        if (rdata.sides == 4) {
            geomRoom = new THREE.BoxGeometry(rdata.depth, rdata.height, rdata.width);
        }
        else {
            geomRoom = new THREE.CylinderGeometry(rdata.width, rdata.width, rdata.height, rdata.sides);
        }

        // console.log("geomRoom", geomRoom);

        const mateRoom = new THREE.MeshBasicMaterial({ color: 0xffffff * Math.random() });
        // const mateRoom = new THREE.MeshBasicMaterial({ color: 0x008800 });
        mateRoom.transparent = true;
        mateRoom.opacity = 0.7;
        this.roomMesh = new THREE.Mesh(geomRoom, mateRoom);
        this.roomMesh.material.side = THREE.BackSide;
        // this.roomMesh.material.side = THREE.DoubleSide;
        this.roomMesh.position.set(0, rdata.height / 2, 0)

        // this.roomMesh.rotateY(degToRad(rdata.rotation))
        this.roomMesh.geometry.computeVertexNormals();

        // this.roomMesh.geometry.attributes
        this.add(this.roomMesh);


        const helper = new VertexNormalsHelper(this.roomMesh, 0.2, 0x00ff00);
        this.add(helper);


        const ptMat = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.3,
        });
        this.ptRoom = new THREE.Points(geomRoom, ptMat)
        this.ptRoom.position.set(0, rdata.height / 2, 0)
        this.add(this.ptRoom);


        // console.log("this.roomMesh", this.roomMesh);

        // const geomTor = new THREE.TorusGeometry(0.1, 0.03, 5, 6);
        // const mateTor = new THREE.MeshBasicMaterial({ color: "cyan" });
        // const torus = new THREE.Mesh(geomTor, mateTor);
        // torus.rotateX(degToRad(90));
        // this.add(torus);

        const origax = new THREE.AxesHelper(0.5);
        // origax.rotateY(degToRad(rdata.rotation))
        this.add(origax);


        this.rotation.y = degToRad(rdata.rotation);

        // for (const child of this.children) {
        //     // child.rotateOnWorldAxis(VEC3_UP, degToRad(rdata.rotation))
        //     // child.setRotationFromAxisAngle(VEC3_UP, degToRad(rdata.rotation))
        //     // child.rotateY(degToRad(rdata.rotation))
        //     child.updateMatrixWorld(true);
        // }
        // this.rotateOnWorldAxis(VEC3_UP, degToRad(rdata.rotation))
        // this.setRotationFromAxisAngle(VEC3_UP, degToRad(rdata.rotation))
        // this.rotateY(degToRad(rdata.rotation))
        // this.updateMatrixWorld(true);
        // this.updateWorldMatrix(true, true);


        this.computeBoundingBox();
    }


    getConnectionPoint(outPos: THREE.Vector3, conData: BldConectedRoom, scene: THREE.Scene) {
        raycaster.ray.origin.copy(this.roomMesh.position)
        raycaster.ray.direction.set(1, 0, 0)
        raycaster.params.Points.threshold = 100;

        raycaster.ray.direction.applyAxisAngle(VEC3_UP, degToRad(conData.conAng))

        if (this.roomMesh.material.side !== THREE.BackSide) {
            // if (this.roomMesh.material.side !== null) {
            // Ray looks from outside !!!!!!!!!!!
            raycaster.ray.at(10000, raycaster.ray.origin)
            raycaster.ray.direction.negate();
        }

        var intersect: THREE.Intersection = null;
        if (conData.snapPoint) {
            intersect = raycaster.intersectObject(this.ptRoom)?.[0];
            // intersect = raycaster.intersectObject(this.roomMesh)?.[0];
        }
        else {
            intersect = raycaster.intersectObject(this.roomMesh)?.[0];
        }

        if (intersect) {
            // console.log("intersect", intersect);

            const linkPoint = intersect.point;
            const linkDir = intersect?.face?.normal;

            outPos.copy(linkPoint);
            outPos.y = conData.conElev;
            console.log("outPos", outPos);

            // this.worldToLocal(outPos)
            // this.localToWorld(outPos)
            // this.localToWorld(linkDir)

            // const arrowHelper = new THREE.ArrowHelper(linkDir, this.worldToLocal(outPos.clone()),
            const arrowHelper = new THREE.ArrowHelper(linkDir.clone(), outPos.clone(),
                0.9, "red", 0.7, 0.3);
            // this.add(arrowHelper);
            scene.add(arrowHelper);
            // this.localToWorld(outPos)

            // link.getWorldDirection(vec3tmp1)
            // link.getWorldPosition(vec3tmp2)
            // // vec3tmp2.copy(link.position)
            // const arrowHelper1 = new THREE.ArrowHelper(vec3tmp1.clone(), vec3tmp2.clone(),
            //     1, "lightblue", 0.8, 0.2);
            // scene.add(arrowHelper1);

        }
        else {
            console.warn("No intersection found", conData, this.roomMesh);
        }


        return outPos;
    }


    dockTo(roomObj1: bRoom, globalJson: BuildingJson, scene: THREE.Scene) {
        const room1 = this.name;
        const room2 = roomObj1.name;



        // // console.log("linkId", linkId);
        // var linkOrig = this.allLinks.get(linkId);
        // var linkDest = roomObj1.allLinks.get(linkId);
        // // console.log("link", linkDest);


        // for (let index = 0; index < 50; index++) {
        //     // TODO FIXME NO IDEA WHY IT NEED TO BE LIKE THIS ......
        //     linkDest.getWorldDirection(vec3tmp2)
        //     linkOrig.getWorldDirection(vec3tmp3)
        //     vec3tmp3.negate();
        //     var angle = vec3tmp3.angleTo(vec3tmp2)
        //     // console.log("radToDeg(angle)", radToDeg(angle));
        //     // this.updateMatrixWorld(true);
        //     if (angle != 0) {
        //         this.rotateOnWorldAxis(VEC3_UP, angle)
        //     } else {
        //         // console.log("index", index);
        //         break;
        //     }
        // }


        this.getConnectionPoint(vec3tmp0, globalJson.rooms[room1].conected[room2], scene)
        roomObj1.getConnectionPoint(vec3tmp1, globalJson.rooms[room2].conected[room1], scene)

        // this.localToWorld(vec3tmp0);
        // roomObj1.localToWorld(vec3tmp1);
        // this.worldToLocal(vec3tmp0);
        // roomObj1.worldToLocal(vec3tmp1);

        this.getWorldPosition(vec3tmp2); vec3tmp0.add(vec3tmp2);
        roomObj1.getWorldPosition(vec3tmp3); vec3tmp1.add(vec3tmp3);

        // this.position.sub(vec3tmp0).add(vec3tmp1);

        const material = new THREE.LineBasicMaterial({ color: 0xa000ff });
        const geometry = new THREE.BufferGeometry().setFromPoints([vec3tmp0.clone(), vec3tmp1.clone()]);
        const line = new THREE.Line(geometry, material);
        scene.add(line);

        // const arrowHelper0 = new THREE.ArrowHelper(vec3tmp2, vec3tmp0.clone(),
        //     1.5, "magenta", 0.8, 0.4);
        // scene.add(arrowHelper0);

        // const arrowHelper1 = new THREE.ArrowHelper(vec3tmp3, vec3tmp1.clone(),
        //     1.5, "pink", 0.8, 0.4);
        // scene.add(arrowHelper1);

    }


    // update(globalJson: BuildingJson, rkey: string, scene: THREE.Scene) {
    //     var roomData = globalJson.rooms[rkey];
    //     // var linksids = Object.keys(roomData.links)
    //     // for (const linkid of linksids) {
    //     //     const linkdata = roomData.links[linkid]
    //     //     raycaster.ray.origin.copy(this.cube.position)
    //     //     raycaster.ray.direction.set(1, 0, 0)


    //     //     if (isNaN(linkdata.onAngle)) {
    //     //         // console.warn(`No onAngle for link:`, linkdata);
    //     //         // continue;
    //     //         linkdata.onAngle = Math.random() * 360;
    //     //     }

    //     //     // console.log("linkdata.onAngle", linkdata.onAngle);

    //     //     raycaster.ray.direction.applyAxisAngle(VEC3_UP, degToRad(linkdata.onAngle))

    //     //     // Ray looks from outside !!!!!!!!!!!
    //     //     raycaster.ray.at(1000, raycaster.ray.origin)
    //     //     raycaster.ray.direction.negate();

    //     //     const arrowHelper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin,
    //     //         0.5, "red", 0.3, 0.05);
    //     //     this.add(arrowHelper);

    //     //     // const intersect = raycaster.intersectObject(this.cube)?.[0];
    //     //     // if (intersect) {
    //     //     //     // console.log("intersect", intersect);
    //     //     //     var link = new bLink();
    //     //     //     const linkPoint = intersect.point;
    //     //     //     const linkDir = intersect.face.normal;
    //     //     //     link.create(globalJson, linkid);
    //     //     //     link.dock(globalJson, linkid, rkey, linkPoint, linkDir);

    //     //     //     this.allLinks.set(linkid, link)
    //     //     //     // this.allLinks.set(link.name, link)
    //     //     //     this.add(link);


    //     //     //     // link.getWorldDirection(vec3tmp1)
    //     //     //     // link.getWorldPosition(vec3tmp2)
    //     //     //     // // vec3tmp2.copy(link.position)
    //     //     //     // const arrowHelper1 = new THREE.ArrowHelper(vec3tmp1.clone(), vec3tmp2.clone(),
    //     //     //     //     1, "lightblue", 0.8, 0.2);
    //     //     //     // scene.add(arrowHelper1);

    //     //     // }
    //     //     // else {
    //     //     //     console.warn("No intersection found", rkey, globalJson, this.cube);
    //     //     // }

    //     // }
    // }


}