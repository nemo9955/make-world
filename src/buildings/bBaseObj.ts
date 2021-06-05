
import * as THREE from "three"; // node_modules/three/build/three.js

// export class bBaseObj extends THREE.Object3D {
export class bBaseObj extends THREE.Group {


    boundingBox = new THREE.Box3();

    constructor() {
        super();
    }



    // TODO implement ObjectPool !!!!
    public free() {
        this?.parent?.remove(this);
    }


    computeBoundingBox() {
        this.boundingBox.makeEmpty();
        this.boundingBox.expandByObject(this);
        for (const child of this.children) {
            this.boundingBox.expandByObject(child);
        }
    }

}