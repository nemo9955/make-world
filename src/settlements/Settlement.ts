

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



// https://en.wikipedia.org/wiki/Human_settlement
// https://en.wikipedia.org/wiki/Town


export class Settlement extends Identifiable {
    vec3pts: any;
    ptsLength: number;
    pos3d: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    colorDebug: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    pts3Vertex: any;
    ptsPred: any;
    color: any;
    ptsEdges: any;
    data: any;
    elevation: any;
    pathToWatter: any;



    constructor(worldData: WorldData) {
        super(worldData);


    }


    scanLand(index: number) {
        throw new Error("Method not implemented.");
    }
    scanWater(index: number) {
        throw new Error("Method not implemented.");
    }
    getLowestElevPoints(elev: any) {
        throw new Error("Method not implemented.");
    }
    getHighestElevPoints(elev: any) {
        throw new Error("Method not implemented.");
    }
    elevOcean(elevOcean: any) {
        throw new Error("Method not implemented.");
    }
    elevMountain(elevMountain: any) {
        throw new Error("Method not implemented.");
    }
    getRiverOrig() {
        throw new Error("Method not implemented.");
    }

}