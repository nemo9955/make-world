
import * as THREE from "three"; // node_modules/three/build/three.js
import { bBaseObj } from "./bBaseObj";
import { BuildingJson } from "./Building";
import { degToRad } from "../utils/Convert";

export class bLink extends bBaseObj {
    torusDest: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
    torusOrig: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;

    constructor() {
        super();
    }

    create(globalJson: BuildingJson, lkey: string) {
        this.name = lkey;
        var ldata = globalJson.links[lkey];
        // console.log("lkey, ldata", lkey, ldata);

        const geomLink = new THREE.BoxGeometry(0.4, 0.7, ldata.length);
        const mateLink = new THREE.MeshBasicMaterial({ color: 0x000088 });
        mateLink.transparent = true;
        mateLink.opacity = 0.7;
        const cube = new THREE.Mesh(geomLink, mateLink);
        geomLink.computeBoundingBox();
        geomLink.boundingBox.getSize(cube.position)
        cube.position.multiplyScalar(0.5);
        // cube.position.x *= 0.5;
        cube.position.x = 0;
        this.add(cube);

        const geomOrig = new THREE.TorusGeometry(0.08, 0.02, 5, 5);
        const mateOrig = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.torusOrig = new THREE.Mesh(geomOrig, mateOrig);
        this.torusOrig.rotateX(degToRad(90));
        this.add(this.torusOrig);

        const geomDest = new THREE.TorusGeometry(0.08, 0.02, 5, 5);
        const mateDest = new THREE.MeshBasicMaterial({ color: "orange" });
        this.torusDest = new THREE.Mesh(geomDest, mateDest);
        this.torusDest.rotateX(degToRad(90));
        // torusDest.position.copy(cube.position)
        geomLink.boundingBox.getSize(this.torusDest.position)
        this.torusDest.position.x = 0;
        this.torusDest.position.y = 0;
        this.add(this.torusDest);
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