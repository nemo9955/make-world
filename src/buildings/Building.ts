
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

export type BldDefaults = {
    onAngle: number,
    elevation: number,
    sides: number,
    height: number,
    width: number,
    depth: number,
    ldepth: number,
    revLink: boolean,
}
export type BldRoomLinkType = {
    name: BldNameType,
    onAngle: number,
    elevation: number,
    revLink: boolean,
}
export type BldRoomType = {
    name: BldNameType,
    sides?: number,
    links: Record<string, BldRoomLinkType>,
    height: number,
    width: number,
    depth?: number,
};
export type BldLinkType = {
    rooms: BldNameType[],
    depth: number,
};
export type BuildingJson = {
    rooms: Record<string, BldRoomType>,
    links: Record<string, BldLinkType>,
    default: BldDefaults,
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

    private getEmptyJson(): BuildingJson {
        return {
            rooms: {}, links: {}, default: {
                onAngle: 0,
                elevation: 0,
                sides: 4,
                height: 2.5,
                width: 2,
                depth: 2,
                ldepth: 0.2,
                revLink: false,
            }
        };
    }

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

            const defaultMatch = line.match(/^(default|defaults)\s*\|/i);
            if (defaultMatch) {
                this.parseDefaultLine(line, asJson)
                continue;
            }

            const roomLinkMatch = line.match(/^([\w-]+)\s*\>\s*([\w-]+)/i);
            if (roomLinkMatch) {
                const room = roomLinkMatch[1]
                const link = roomLinkMatch[2]
                this.parseRoomLinkLine(room, link, line, asJson)
                continue;
            }


        }

        // console.log("asJson", JSON.stringify(asJson, null, 4));
        this.fromJson(asJson);
    }



    private parseDefaultLine(line: string, asJson: BuildingJson) {
        const pipeData = line.match(/\|([^<>|]+)/i)?.[1]

        if (pipeData) {
            this.genericSetNumberFromLine(pipeData, /ang/, (asNumber) => {
                asJson.default.onAngle = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /sides/, (asNumber) => {
                asJson.default.sides = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /lLen|lnkDepth|ld/, (asNumber) => {
                asJson.default.ldepth = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /height|rh/, (asNumber) => {
                asJson.default.height = asNumber
            }, null)
            this.genericSetNumberFromLine(pipeData, /width|rw/, (asNumber) => {
                asJson.default.width = asNumber
            }, null)
            this.genericSetNumberFromLine(pipeData, /depth|rd/, (asNumber) => {
                asJson.default.depth = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /elev|elevation/, (asNumber) => {
                asJson.default.elevation = asNumber
            }, null)
        }
    }



    private parseRoomLinkLine(room: string, link: string, line: string, asJson: BuildingJson) {

        if (!asJson.rooms.hasOwnProperty(room))
            asJson.rooms[room] = {
                links: {},
                name: room,
                sides: asJson.default.sides,
                height: asJson.default.height,
                width: asJson.default.width,
                depth: asJson.default.depth, // will be ignored depending on sides
            }

        if (!asJson.rooms[room].links.hasOwnProperty(link))
            asJson.rooms[room].links[link] = {
                name: link,
                revLink: asJson.default.revLink,
                onAngle: asJson.default.onAngle,
                elevation: asJson.default.elevation,
            }

        if (!asJson.links.hasOwnProperty(link))
            asJson.links[link] = {
                rooms: [],
                depth: asJson.default.ldepth,
            }

        if (asJson.links[link].rooms.includes(room) == false)
            asJson.links[link].rooms.push(room)

        const pipeData = line.match(/\|([^<>|]+)/i)?.[1]
        if (pipeData) {
            this.genericSetNumberFromLine(pipeData, /ang/, (asNumber) => {
                asJson.rooms[room].links[link].onAngle = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /sides/, (asNumber) => {
                asJson.rooms[room].sides = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /lLen|lnkDepth|ld/, (asNumber) => {
                asJson.links[link].depth = asNumber;
                if (asNumber < 0) asJson.rooms[room].links[link].revLink = true;
            }, null)

            this.genericSetNumberFromLine(pipeData, /height|rh/, (asNumber) => {
                asJson.rooms[room].height = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /width|rw/, (asNumber) => {
                asJson.rooms[room].width = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /depth|rd/, (asNumber) => {
                asJson.rooms[room].depth = asNumber
            }, null)

            this.genericSetNumberFromLine(pipeData, /elev|elevation/, (asNumber) => {
                asJson.rooms[room].links[link].elevation = asNumber
            }, asJson.rooms[room].height)
        }
    }



    private genericSetNumberFromLine(
        line: string,
        fider: RegExp,
        callback: any = null,
        procTarget: number = null,
        units: RegExp = /\S*/,
    ): number {

        const fancyAngleMatch = /(\S*)(-?\d+\.?\d*)\,(-?\d+\.?\d*)\,(-?\d+\.?\d*)/;
        const fancyAngleRegex = new RegExp(`\\b(${fider.source}):${fancyAngleMatch.source}`, "i")
        const fancyAngleMatcher = line.match(fancyAngleRegex);
        if (fancyAngleMatcher) {
            var [fullMatch, findName, faFlag, faMax, faSide, faProc, ...restData] = fancyAngleMatcher;
            const nMax = toNumber(faMax);
            const nSide = toNumber(faSide);
            const nProc = toNumber(faProc);

            const segFull = 360 / nMax;
            const segPart = (nProc / 100) * segFull;
            var asNum = (segFull * nSide) + segPart;

            if (faFlag == "h") asNum -= segFull / 2;
            if (faFlag == "H") asNum += segFull / 2;

            // console.log(asNum, { nMax, nSide, nProc }, { segFull, segPart, asNum });

            if (callback) callback(asNum, findName, mWord, null);
            return asNum;
        }


        const numMatch = /-?\d+\.?\d*/;
        const numberRegex = new RegExp(`\\b(${fider.source}):(${numMatch.source})(${units.source})`, "i")
        const numberMatcher = line.match(numberRegex);
        if (numberMatcher) {
            // console.log("matcher", matcher);
            var [fullMatch, findName, numVal, numUnit, ...restData] = numberMatcher;
            var asNum = 0;
            const tmpAsNumber = toNumber(numVal)

            if (!numUnit) asNum = tmpAsNumber;
            else if (numUnit == "%" && isFinite(procTarget)) asNum = (tmpAsNumber / 100) * procTarget;
            else if (numUnit == "m") asNum = tmpAsNumber; // default is meters
            else if (numUnit == "cm") asNum = Convert.cmToM(tmpAsNumber);
            else {
                console.warn(`No value can be extracted numberMatcher`, { line, matcher: numberMatcher });
                return null;
            }

            if (callback) callback(asNum, findName, numVal, numUnit);
            return asNum;
        }


        const wordMatch = /\S+/;
        const wordRegex = new RegExp(`\\b(${fider.source}):(${wordMatch.source})`, "i")
        const wordMatcher = line.match(wordRegex);
        if (wordMatcher) {
            // console.log("matcher", matcher);
            var [fullMatch, findName, mWord, ...restData] = wordMatcher;
            var asNum = 0;
            const tmpAsNumber = toNumber(mWord)

            if (isFinite(tmpAsNumber)) asNum = tmpAsNumber;
            else if (mWord === "north") asNum = 0;
            else if (mWord === "east") asNum = 270; // 270/90 rotation is CW
            else if (mWord === "south") asNum = 180;
            else if (mWord === "west") asNum = 90; // 90/270 rotation is CW
            else {
                console.warn(`No value can be extracted wordMatcher`, { line, matcher: wordMatcher });
                return null;
            }

            if (callback) callback(asNum, findName, mWord, null);
            return asNum;
        }

        return undefined;
    }



    fromJson(json: BuildingJson) {

        const grKeys = Object.keys(this.globalJson.rooms);
        const lrKeys = Object.keys(json.rooms);

        const gdelRoom = difference(grKeys, lrKeys);
        const gaddRoom = difference(lrKeys, grKeys);
        const gupdRoom = intersection(lrKeys, grKeys);

        this.globalJson.links = json.links; // just copy all the links
        this.globalJson.default = json.default;

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
            if (!this.breathRoomsList.includes(room))
                this.rootRooms.push(room)
            this.genGraphStep(room);
        }
        this.graphRooms.reverse();
    }


    placeIgnoreLinks(listOfRooms: bRoom[]) {

        const disPtsData = Points.get2dGridPropPositions(listOfRooms.length);
        // console.log("disPtsData", disPtsData);

        this.maxEdge = 0;
        var tmpvec3 = new THREE.Vector3();
        for (const room of listOfRooms) {
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
        for (const room of listOfRooms) {
            const pt = displayPoints[dpIndex++];
            room.position.set((pt[0] - 0.5) * 2 * distx, 0, (pt[1] - 0.5) * 2 * distz)
            // console.log("room.position", room.position);
        }


    }

    placeRespectLinks() {
        var tmpvec3 = new THREE.Vector3();

        this.placeIgnoreLinks(this.rootRooms);

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


        // const usedCount = this.allRooms.size ;
        const usedCount = this.rootRooms.length;
        const disPtsData = Points.get2dGridPropPositions(usedCount);
        var distx = disPtsData.cols * this.maxEdge * EXTRA_SPACE;

        // // more from the TOP
        // const camExtra = distx * 0.99;
        // camera.position.set(-1 * 0.1 * camExtra, camExtra, 0);
        // tmpvec3.set(0, 0, 0);
        // camera.lookAt(tmpvec3);
        // controls.target.copy(tmpvec3)

        // more from the DIAGONAL
        const camExtra = distx * .8;
        camera.position.set(-1 * 0.4 * camExtra, camExtra, 0);
        // tmpvec3.set(distx * -0.2, 0, 0);
        tmpvec3.set(0, 0, 0);
        camera.lookAt(tmpvec3);
        controls.target.copy(tmpvec3)

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