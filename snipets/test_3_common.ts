
console.log("START test_3!")


import { openDB, deleteDB, wrap, unwrap } from 'idb';
import * as THREE from "three";
import * as tfps from "three-fps-counter";

export function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}


export class ThreejsCube {
    renderer: any;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cubes: Map<number, THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>>;
    boundAnimate: any;
    geometry: THREE.BoxGeometry;
    material: THREE.MeshBasicMaterial;

    fps : any;
    db : any;

    constructor(renderer: any) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 400 / 200, 0.1, 1000);
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.camera.position.z = 10;


        this.fps = new (tfps(THREE))(this.renderer)
        this.cubes = new Map()

        this.get_cubes();

        this.boundAnimate = this.animate.bind(this);
    }

    async get_cubes() {

        this.db = await openDB("test_3", 1)
        // const db = await openDB("test_3", 1);
        const db_cubes = await this.db.getAllFromIndex('cubes', 'id')
        console.log("db_cubes", db_cubes);

        db_cubes.forEach(cube_ => {
            // console.log("cube_", cube_);

            var cube_obj = new THREE.Mesh(this.geometry, this.material);
            cube_obj.position.x = cube_.x
            cube_obj.position.y = cube_.y
            cube_obj.position.z = cube_.z
            cube_obj.rotation.x = cube_.rx
            cube_obj.rotation.y = cube_.ry
            cube_obj.rotation.z = cube_.rz

            this.scene.add(cube_obj);
            this.cubes[cube_.id] = cube_obj
        });


        // this.cube = new THREE.Mesh(this.geometry, this.material);
        // this.scene.add(this.cube);

    }

    async animate() {
        requestAnimationFrame(this.boundAnimate);


        let cursor = await this.db.transaction('cubes').store.openCursor();

        while (cursor) {
            //   console.log(cursor.key, cursor.value);
            const cube_ = { ...cursor.value };
            const cube_obj = this.cubes[cube_.id]
            if(cube_obj){
                cube_obj.rotation.x += 0.01;
                // cube_obj.rotation.x = cube_.rx
                cube_obj.rotation.y = cube_.ry
                // cube_obj.rotation.z = cube_.rz

            }
            cursor = await cursor.continue();
        }



        // this.cubes.forEach(cube_ => {
        //     cube_.rotation.x += 0.01;
        //     cube_.rotation.y += 0.01;
        // });
        this.renderer.render(this.scene, this.camera);
        this.fps.render()

    }
}

console.log("DONE test_3!")
