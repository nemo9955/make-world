

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
import { isNumber, toNumber, uniq } from "lodash";


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
};
export type BuildingJson = {
    rooms: Record<string, BldRoomType>,
    links: Record<string, BldMainLinkType>,
};




export class Building {

    scene: THREE.Scene = null;

    globalJson: BuildingJson;

    constructor() {
        this.globalJson = this.getEmptyJson();
    }

    private getEmptyJson(): BuildingJson {
        return {
            rooms: {},
            links: {},
        };
    }

    init(scene: THREE.Scene) {
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
                }
                if (!asJson.rooms[room].links.hasOwnProperty(link)) {
                    asJson.rooms[room].links[link] = {}
                }
                if (!asJson.links.hasOwnProperty(link)) {
                    asJson.links[link] = {}
                    asJson.links[link].links = []
                }

                asJson.rooms[room].links[link].name = link;

                asJson.links[link].links.push(room)
                asJson.links[link].links = uniq(asJson.links[link].links)


                const pipeData = line.match(/\|([^<>|]+)/i)?.[1];
                if (pipeData) {
                    // console.log("pipeData", pipeData);
                    const pdOn = pipeData.match(/on:(\w+)/i)?.[1];
                    if (pdOn) {
                        // console.log("pdOn", pdOn);
                        var asAngle = 0;
                        if (isNumber(pdOn)) asAngle = toNumber(pdOn);
                        else if (pdOn === "nord") asAngle = 0;
                        else if (pdOn === "east") asAngle = 90;
                        else if (pdOn === "sud") asAngle = 180;
                        else if (pdOn === "west") asAngle = 270;
                        asJson.rooms[room].links[link].onAngle = asAngle;
                    }

                }
            }

        }

        this.fromJson(asJson);
    }

    fromJson(json: BuildingJson) {
        console.log("json", JSON.stringify(json, null, 4));




    }

}