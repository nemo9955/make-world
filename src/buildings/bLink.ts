
import * as THREE from "three"; // node_modules/three/build/three.js
import { bBaseObj } from "./bBaseObj";
import { BuildingJson } from "./Building";
import { degToRad } from "../utils/Convert";


const vec3tmp0 = new THREE.Vector3();

export class bLink extends bBaseObj {
    torusDest: THREE.Object3D;
    torusOrig: THREE.Object3D;

    constructor() {
        super();
    }

    create(globalJson: BuildingJson, lkey: string) {
        this.name = lkey;
        var ldata = globalJson.links[lkey];
        // console.log("lkey, ldata", lkey, ldata);

        const geomLink = new THREE.BoxGeometry(0.4, 0.7, ldata.depth);
        const mateLink = new THREE.MeshBasicMaterial({ color: 0x000088 });
        mateLink.side = THREE.BackSide;
        mateLink.transparent = true;
        mateLink.opacity = 0.4;
        const cube = new THREE.Mesh(geomLink, mateLink);
        geomLink.computeBoundingBox();
        geomLink.boundingBox.getSize(cube.position)
        cube.position.multiplyScalar(0.5);
        // cube.position.x *= 0.5;
        cube.position.x = 0;
        this.add(cube);

        // const geomOrig = new THREE.TorusGeometry(0.08, 0.02, 5, 5);
        // const mateOrig = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        // this.torusOrig = new THREE.Mesh(geomOrig, mateOrig);
        // this.torusOrig.rotateX(degToRad(90));
        // this.add(this.torusOrig);

        this.torusOrig = new THREE.AxesHelper(0.3);
        this.add(this.torusOrig);

        const geomDest = new THREE.TorusGeometry(0.08, 0.02, 5, 5);
        const mateDest = new THREE.MeshBasicMaterial({ color: "orange" });
        this.torusDest = new THREE.Mesh(geomDest, mateDest);
        this.torusDest.rotateX(degToRad(90));
        // torusDest.position.copy(cube.position)
        geomLink.boundingBox.getSize(this.torusDest.position)
        this.torusDest.position.y = 0;

        this.add(this.torusDest);

        cube.position.x = 0;
        this.torusDest.position.x = 0;

    }


    dock(globalJson: BuildingJson, linkid: string, roomid: string, linkPoint: THREE.Vector3, linkDir: THREE.Vector3) {
        var roomData = globalJson.rooms[roomid];
        const linkdata = roomData.links[linkid]
        var ldata = globalJson.links[linkid];

        this.position.copy(linkPoint)
        // this.position.add(vec3tmp0.copy(intersect.face.normal).setScalar(0.001))
        // this.position.y = 0; // move it on the ground ... could be mutch better ...
        this.position.y = linkdata.elevation;

        if (linkdata.revLink) {
            vec3tmp0.copy(this.position).sub(linkDir)
            // this.rotateY(degToRad(90));
        } else {
            vec3tmp0.copy(this.position).add(linkDir)
        }

        this.lookAt(vec3tmp0);
        // link.rota

    }


    getPosOrig(out: THREE.Vector3) {
        out.copy(this.torusOrig.position)
        return out
    }

    getPosDest(out: THREE.Vector3) {
        out.copy(this.torusDest.position)
        return out
    }


}