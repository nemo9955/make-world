
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls" // node_modules/three/examples/jsm/controls/OrbitControls.js

import { Color, colorArray } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { freeFloat32Array, freeUint8Array, getFloat32Array, getUint8Array, ObjectPool } from "../utils/ObjectPool";
import { WorldData } from "../modules/WorldData";
import { Orbit } from "../orbiting_elements/Orbit";
import { OrbitingElement } from "../orbiting_elements/OrbitingElement";
import { PlanetarySystem } from "../orbiting_elements/PlanetarySystem";
import { Planet } from "../orbiting_elements/Planet";
import { Identifiable } from "../modules/ObjectsHacker";


import { pointGeoArr, pointGeo, arr3numb } from "../utils/Points";
import * as Points from "../utils/Points"
import * as Calc from "../utils/Calc"

import * as THREE from "three";
import * as dju from "../utils/dij_utils";

import * as d3 from "d3"
import * as Graph from "../utils/Graph";

import { Heapify } from "../utils/Heapify";
import { difference, intersection, isNumber, toNumber, uniq } from "lodash";
import { bBaseObj } from "./bBaseObj";
import { bRoom } from "./bRoom";
import { Vector3 } from "three";
import { bLink } from "./bLink";


// https://en.wikipedia.org/wiki/Building
// https://en.wikipedia.org/wiki/House

// https://www.reddit.com/r/typescript/comments/hxo7c9/type_nested_object/

export type BldNameType = string;
export type BldMainLinkType = {
    links?: BldNameType[],
}
export type BldRoomLinkType = {
    name?: BldNameType,
    onAngle?: number,
}
export type BldRoomType = {
    links?: Record<string, BldRoomLinkType>,
    sides?: number,
};
export type BldLinkType = {
    rooms?: BldNameType[],
    length?: number,
};
export type BuildingJson = {
    rooms: Record<string, BldRoomType>,
    links: Record<string, BldLinkType>,
};

export type BldGraphRoom = {
    room1: BldNameType,
    room2: BldNameType,
    link: BldNameType,
};



const EXTRA_SPACE = 3;


export class Building {

    scene: THREE.Scene = null;

    globalJson: BuildingJson;
    maxEdge: number;
    rootRooms: bRoom[];
    breathRoomsList: bRoom[];
    graphRooms: BldGraphRoom[];

    constructor() {
        this.globalJson = this.getEmptyJson();
        this.rootRooms = [];
    }

    private getEmptyJson(): BuildingJson { return { rooms: {}, links: {}, }; }

    init(scene: THREE.Scene,) {
        this.scene = scene;
    }



    fromText(text: string) {
        const textArr = text.split("\n")

        var asJson: BuildingJson = this.getEmptyJson();

        for (let index = 0; index < textArr.length; index++) {
            var line = textArr[index];
            line = line.trim();
            if (!line) continue;
            // console.log("line", line);

            const decRoomLink = line.match(/^([\w-]+)\s*\>\s*([\w-]+)/i);
            if (decRoomLink) {
                const room = decRoomLink[1];
                const link = decRoomLink[2];

                if (!asJson.rooms.hasOwnProperty(room)) {
                    asJson.rooms[room] = {}
                    asJson.rooms[room].links = {}
                    asJson.rooms[room].sides = 4;
                }

                if (!asJson.rooms[room].links.hasOwnProperty(link)) {
                    asJson.rooms[room].links[link] = {}
                    asJson.rooms[room].links[link].onAngle = 0;
                }

                if (!asJson.links.hasOwnProperty(link)) {
                    asJson.links[link] = {}
                    asJson.links[link].rooms = []
                    asJson.links[link].length = 1;
                }

                asJson.rooms[room].links[link].name = link;

                if (asJson.links[link].rooms.includes(room) == false)
                    asJson.links[link].rooms.push(room)

                const pipeData = line.match(/\|([^<>|]+)/i)?.[1];
                if (pipeData) {
                    // console.log("pipeData", pipeData);
                    const pdOn = pipeData.match(/on:(-?\w+)/i)?.[1];
                    if (pdOn) {
                        // console.log("pdOn", pdOn);
                        const tmpAsNumber = toNumber(pdOn)
                        var asAngle = 0;
                        if (isFinite(tmpAsNumber)) asAngle = tmpAsNumber;
                        else if (pdOn === "north") asAngle = 0;
                        else if (pdOn === "east") asAngle = 90;
                        else if (pdOn === "south") asAngle = 180;
                        else if (pdOn === "west") asAngle = 270;
                        else console.warn(`No value can be extracted`, pdOn)
                        // console.log("pdOn, asAngle", pdOn, asAngle);
                        asJson.rooms[room].links[link].onAngle = asAngle;
                    }


                    const pdSides = pipeData.match(/sides:(-?\w+)/i)?.[1];
                    if (pdSides) {
                        // console.log("pdSides,room", pdSides, room);
                        const tmpAsNumber = toNumber(pdSides)
                        var asNumber = 4;
                        if (isFinite(tmpAsNumber)) asNumber = tmpAsNumber;
                        else console.warn(`No value can be extracted`, pdSides)
                        asJson.rooms[room].sides = asNumber;
                    }


                    const pdLinkLen = pipeData.match(/(lLen|linkLen|linkLength):(-?\w+)/i)?.[2];
                    if (pdLinkLen) {
                        const tmpAsNumber = toNumber(pdLinkLen)
                        var asNumber = 1;
                        if (isFinite(tmpAsNumber)) asNumber = tmpAsNumber;
                        else console.warn(`No value can be extracted`, pdLinkLen)
                        asJson.links[link].length = asNumber;
                    }



                    // const pdPlaceh = pipeData.match(/on:(-?\w+)/i)?.[1];
                    // if (pdPlaceh) {
                    //     const tmpAsNumber = toNumber(pdPlaceh)
                    //     var asNumber = 0;
                    //     if (isFinite(tmpAsNumber)) asNumber = tmpAsNumber;
                    //     else if (pdPlaceh === "north") asNumber = 0;
                    //     else if (pdPlaceh === "east") asNumber = 90;
                    //     else if (pdPlaceh === "south") asNumber = 180;
                    //     else if (pdPlaceh === "west") asNumber = 270;
                    //     else console.warn(`No value can be extracted`, pdPlaceh)
                    //     asJson.rooms[room].links[link].onAngle = asNumber;
                    // }
                }
            }

        }

        // console.log("asJson", JSON.stringify(asJson, null, 4));
        this.fromJson(asJson);
    }

    fromJson(json: BuildingJson) {

        const grKeys = Object.keys(this.globalJson.rooms);
        const lrKeys = Object.keys(json.rooms);

        const gdelRoom = difference(grKeys, lrKeys);
        const gaddRoom = difference(lrKeys, grKeys);
        const gupdRoom = intersection(lrKeys, grKeys);

        this.globalJson.links = json.links; // just copy all the links

        for (const rkey of gaddRoom)
            this.addRoom(rkey, json);
        for (const rkey of gdelRoom)
            this.deleteRoom(rkey);
        for (const rkey of gupdRoom) /// no update until internal structure is also properly managed
            // this.updateRoom(rkey, json);
            this.deleteRoom(rkey), this.addRoom(rkey, json);


        this.genGraph();
    }


    private genGraphStep(room: bRoom) {
        if (this.breathRoomsList.includes(room)) return;
        this.breathRoomsList.push(room);

        // console.log("room", room);
        const roomLinks = Object.keys(this.globalJson.rooms[room.name].links);
        for (const link of roomLinks) {
            // var liroom = this.allRooms.get(link);
            var linkedRooms = this.globalJson.links[link].rooms
            for (const linkedRoomName of linkedRooms) {
                var linkedRoom = this.allRooms.get(linkedRoomName)

                if (this.breathRoomsList.includes(linkedRoom)) continue;
                room.linkedRooms.push(linkedRoom)
                this.genGraphStep(linkedRoom);

                if (room.name == linkedRoom.name) continue;
                this.graphRooms.push({
                    room1: room.name,
                    room2: linkedRoom.name,
                    link: link,
                })
            }
        }
    }



    genGraph() {
        this.breathRoomsList = []
        this.graphRooms = [];
        this.rootRooms = [];
        for (const room of this.allRooms.values()) {
            this.genGraphStep(room);
        }
        this.graphRooms.reverse();
    }


    placeIgnoreLinks() {

        const disPtsData = Points.get2dGridPropPositions(this.allRooms.size);

        this.maxEdge = 0;
        var tmpvec3 = new THREE.Vector3();
        for (const room of this.allRooms.values()) {
            // room.computeBoundingBox();
            room.boundingBox.getSize(tmpvec3);
            this.maxEdge = Math.max(this.maxEdge, tmpvec3.x)
            this.maxEdge = Math.max(this.maxEdge, tmpvec3.z)
        }
        // console.log("maxHalfEdge", maxHalfEdge);


        var distx = disPtsData.cols * this.maxEdge * EXTRA_SPACE;
        var distz = disPtsData.rows * this.maxEdge * EXTRA_SPACE;
        // console.log("distx, distz", distx, distz);


        const displayPoints = disPtsData.points
        var dpIndex = 0;
        for (const room of this.allRooms.values()) {
            const pt = displayPoints[dpIndex++];
            room.position.set((pt[0] - 0.5) * 2 * distx, 0, (pt[1] - 0.5) * 2 * distz)
            // console.log("room.position", room.position);
        }

        for (const room of this.allRooms.values()) {
            // console.log("room.position", room.position);
            // console.log("room.cube.position", room.cube.position);
        }


    }

    placeRespectLinks() {
        var tmpvec3 = new THREE.Vector3();

        // this.placeIgnoreLinks();

        // console.log("this.graphRooms", this.graphRooms);
        for (const { room1, room2, link } of this.graphRooms) {
            const roomObj1 = this.allRooms.get(room1);
            const roomObj2 = this.allRooms.get(room2);

            // console.log("....", room1, room2, link);
            roomObj2.dockTo(roomObj1, link, this.scene);
        }


    }


    adaptCamera(camera: THREE.Camera, controls: OrbitControls) {
        var tmpvec3 = new THREE.Vector3();


        this.maxEdge = 0;
        for (const room of this.allRooms.values()) {
            room.boundingBox.getSize(tmpvec3);
            this.maxEdge = Math.max(this.maxEdge, tmpvec3.x)
            this.maxEdge = Math.max(this.maxEdge, tmpvec3.z)
        }


        const disPtsData = Points.get2dGridPropPositions(this.allRooms.size);
        var distx = disPtsData.cols * this.maxEdge * EXTRA_SPACE;

        // more from the TOP
        const camExtra = distx * 0.99;
        camera.position.set(-1 * 0.1 * camExtra, camExtra, 0);
        tmpvec3.set(0, 0, 0);
        camera.lookAt(tmpvec3);
        controls.target.copy(tmpvec3)

        // more from the DIAGONAL
        // const camExtra = distx * 0.5;
        // camera.position.set(-1 * 1.4 * camExtra, camExtra, 0);
        // tmpvec3.set(distx * -0.2, 0, 0);
        // camera.lookAt(tmpvec3);
        // controls.target.copy(tmpvec3)

    }

    allRooms = new Map<string, bRoom>()
    allLinks = new Map<string, bLink>()

    private addRoom(rkey: string, json: BuildingJson) {
        // console.log("added rkey", rkey);
        this.globalJson.rooms[rkey] = json.rooms[rkey];
        const room = new bRoom();
        room.create(this.globalJson, rkey)
        this.scene.add(room);
        this.allRooms.set(rkey, room);
        this.updateRoom(rkey, json); // this will actually set all the right properties
    }

    private updateRoom(rkey: string, json: BuildingJson) {
        // console.log("update rkey", rkey);
        this.globalJson.rooms[rkey] = json.rooms[rkey];
        const room = this.allRooms.get(rkey);
        room.update(this.globalJson, rkey, this.scene)
    }

    private deleteRoom(rkey: string) {
        // console.log("deleted rkey", rkey);
        delete this.globalJson.rooms[rkey];
        const room = this.allRooms.get(rkey);
        room.free();
        this.allRooms.delete(rkey);
    }



    printGlobJson() {
        console.log("this.globalJson", JSON.stringify(this.globalJson, null, 4));
    }


}