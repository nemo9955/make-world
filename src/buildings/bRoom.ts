
import * as THREE from "three"; // node_modules/three/build/three.js
import { bBaseObj } from "./bBaseObj";
import { BldRoomType, Building, BuildingJson } from "./Building";
import { degToRad, radToDeg } from "../utils/Convert";
import { bLink } from "./bLink";



const raycaster: THREE.Raycaster = new THREE.Raycaster();

const VEC3_UP = new THREE.Vector3(0, 1, 0);
const vec3tmp0 = new THREE.Vector3();
const vec3tmp1 = new THREE.Vector3();
const vec3tmp2 = new THREE.Vector3();
const vec3tmp3 = new THREE.Vector3();
const quattmp1 = new THREE.Quaternion();

export class bRoom extends bBaseObj {
    cube: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
    linkedRooms: bRoom[] = [];


    allLinks = new Map<string, bLink>()


    constructor() {
        super();



    }


    create(globalJson: BuildingJson, rkey: string) {
        this.name = rkey;
        var rdata = globalJson.rooms[rkey];


        // const geomRoom = new THREE.BoxGeometry(1, 1, 1);
        const geomRoom = new THREE.CylinderGeometry(2, 2, 1, rdata.sides);
        const mateRoom = new THREE.MeshBasicMaterial({ color: 0x008800 });
        mateRoom.transparent = true;
        mateRoom.opacity = 0.9;
        this.cube = new THREE.Mesh(geomRoom, mateRoom);
        this.cube.material.side = THREE.BackSide;
        this.cube.position.set(0, 0.5, 0)
        this.add(this.cube);

        const geomTor = new THREE.TorusGeometry(0.1, 0.03, 5, 6);
        const mateTor = new THREE.MeshBasicMaterial({ color: "cyan" });
        const torus = new THREE.Mesh(geomTor, mateTor);
        torus.rotateX(degToRad(90));
        this.add(torus);


        this.computeBoundingBox();
    }

    update(globalJson: BuildingJson, rkey: string, scene: THREE.Scene) {
        var roomData = globalJson.rooms[rkey];
        var linksids = Object.keys(roomData.links)
        for (const linkid of linksids) {
            const linkdata = roomData.links[linkid]
            raycaster.ray.origin.copy(this.cube.position)
            raycaster.ray.direction.set(1, 0, 0)


            if (isNaN(linkdata.onAngle)) {
                // console.warn(`No onAngle for link:`, linkdata);
                // continue;
                linkdata.onAngle = Math.random() * 360;
            }

            // console.log("linkdata.onAngle", linkdata.onAngle);

            raycaster.ray.direction.applyAxisAngle(VEC3_UP, degToRad(linkdata.onAngle))
            // console.log("raycaster.ray.direction", raycaster.ray.direction);

            const arrowHelper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin,
                0.5, "red", 0.3, 0.05);
            this.add(arrowHelper);

            const intersect = raycaster.intersectObject(this.cube)?.[0];
            if (intersect) {
                // console.log("intersect", intersect);
                var link = new bLink();
                link.create(globalJson, linkid);
                link.position.copy(intersect.point)
                link.position.add(vec3tmp0.copy(intersect.face.normal).setScalar(0.001))
                link.position.y = 0; // move it on the ground ... could be mutch better ...
                vec3tmp0.copy(link.position).add(intersect.face.normal)
                link.lookAt(vec3tmp0);
                // link.rota
                this.allLinks.set(linkid, link)
                // this.allLinks.set(link.name, link)
                this.add(link);


                // link.getWorldDirection(vec3tmp1)
                // link.getWorldPosition(vec3tmp2)
                // // vec3tmp2.copy(link.position)
                // const arrowHelper1 = new THREE.ArrowHelper(vec3tmp1.clone(), vec3tmp2.clone(),
                //     1, "lightblue", 0.8, 0.2);
                // scene.add(arrowHelper1);

            }
            else {
                console.warn("No intersection found", rkey, globalJson, this.cube);
            }

        }
    }



    dockTo(roomObj1: bRoom, linkId: string, scene: THREE.Scene) {
        // console.log("linkId", linkId);
        var linkOrig = this.allLinks.get(linkId);
        var linkDest = roomObj1.allLinks.get(linkId);
        // console.log("link", linkDest);


        for (let index = 0; index < 50; index++) {
            // TODO FIXME NO IDEA WHY IT NEED TO BE LIKE THIS ......
            linkDest.getWorldDirection(vec3tmp2)
            linkOrig.getWorldDirection(vec3tmp3)
            vec3tmp3.negate();
            var angle = vec3tmp3.angleTo(vec3tmp2)
            // console.log("radToDeg(angle)", radToDeg(angle));
            // this.updateMatrixWorld(true);
            if (angle != 0) {
                this.rotateOnWorldAxis(VEC3_UP, angle)
            } else {
                // console.log("index", index);
                break;
            }
        }



        linkDest.torusDest.getWorldPosition(vec3tmp0);
        linkOrig.torusOrig.getWorldPosition(vec3tmp1);
        this.position.add(vec3tmp0).sub(vec3tmp1);



        // const arrowHelper0 = new THREE.ArrowHelper(vec3tmp2, vec3tmp0.clone(),
        //     1.5, "magenta", 0.8, 0.4);
        // scene.add(arrowHelper0);

        // const arrowHelper1 = new THREE.ArrowHelper(vec3tmp3, vec3tmp1.clone(),
        //     1.5, "pink", 0.8, 0.4);
        // scene.add(arrowHelper1);

        // const material = new THREE.LineBasicMaterial({ color: 0xa000ff });
        // const geometry = new THREE.BufferGeometry().setFromPoints([vec3tmp0, vec3tmp1]);
        // const line = new THREE.Line(geometry, material);
        // scene.add(line);
    }


}