
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


/*

about octaves and persistence : https://adrianb.io/2014/08/09/perlinnoise.html
with generic js implementation  : https://github.com/joshforisha/fractal-noise-js/blob/main/src/index.ts

https://medium.com/@yvanscher/playing-with-perlin-noise-generating-realistic-archipelagos-b59f004d8401

Also see for 4D noise  :
https://github.com/joshforisha/open-simplex-noise-js


https://www.npmjs.com/package/noisejs
var noise = new Noise(Math.random());
simplex2(x, y): 2D Simplex noise function
simplex3(x, y, z): 3D Simplex noise function
perlin2(x, y): 2D Perlin noise function
perlin3(x, y, z): 3D Perlin noise function
seed(val): Seed the noise functions. Only 65536 different seeds are supported. Use a float between 0 and 1 or an integer from 1 to 65536.



https://github.com/joshforisha/open-simplex-noise-js

*/


// import ConvexGeometry from

import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry"
import { ConvexHull } from "three/examples/jsm/math/ConvexHull"
// node_modules/@types/three/examples/jsm/geometries/ConvexGeometry.d.ts
// node_modules/three/examples/jsm/geometries/ConvexGeometry.js   ConvexGeometry
// node_modules/three/examples/jsm/math/ConvexHull.js

export const TerrMask = {
    // https://www.w3schools.com/js/js_bitwise.asp
    WATER: 1 << 0,
    LAND: 1 << 1,
    MOUNTAIN: 1 << 2,
}


function tnoise(x: number, y: number, z: number, data: TerrainData, noise: Noise): number {
    // Convert.mapLinear(rawNoiseVal, 0, 1, minElev, maxElev)

    var value = 0.0;
    for (let octave = 0; octave < data.noiseOctaves; octave++) {
        const freq = data.noiseFrequency * Math.pow(2, octave);
        value += noise.perlin3(x * freq, y * freq, z * freq) *
            (data.noiseAmplitude * Math.pow(data.noisePersistence, octave));
    }
    value = value / (2 - 1 / Math.pow(2, data.noiseOctaves - 1));


    if (data.noiseExponent1 !== 1) {
        const sign = Math.sign(value)
        value = Math.pow(Math.abs(value), data.noiseExponent1);
        value *= sign;
    }

    if (data.noiseApplyAbs)
        value = ((Math.abs(value)) * 2) - 1

    // console.log("value", value);
    return value
}



export class TerrainData extends Identifiable {

    sphereSize: number;
    altitudeMinProc: number;
    altitudeMaxProc: number;
    altitudeOceanProc: number;
    altitudeMountainProc: number;
    pointsToGen: number;
    noiseSeed: number;
    noiseApplyAbs: boolean;
    noiseOctaves: number;
    noiseFrequency: number;
    noiseAmplitude: number;
    noisePersistence: number;
    noiseExponent1: number;

    constructor(worldData: WorldData) {
        super(worldData);

        this.sphereSize = 1000;
        this.pointsToGen = 1000 * 30;
        // this.pointsToGen = 100;
        this.altitudeMinProc = -0.03;
        this.altitudeMaxProc = +0.03;
        this.altitudeOceanProc = 0.5;
        this.altitudeMountainProc = 0.8;
        this.noiseApplyAbs = false;
        this.noiseSeed = Math.random();

        this.noiseFrequency = 2.5;
        this.noiseAmplitude = 2.5;
        this.noisePersistence = 0.6;
        this.noiseOctaves = 5;
        this.noiseExponent1 = 1.0;
        // this.noiseExponent1 = 0.7;


    }

    public clone() { return new TerrainData(this.getWorldData()).copyLogic(this) }
    public static clone(worldData: WorldData, data_: any) { return new TerrainData(worldData).copyDeep(data_) }
    static get type() { return `TerrainData` }
}

export class Terrain {
    data: TerrainData;
    public orbitElemId: number = null;
    private noise: Noise;
    private isWorking = false;

    get world() { return this.data.getWorldData(); }
    get id() { return this.data.id; }

    ptsLength: number
    ptsMaxLength: number

    // TODO use a typedArray pool like https://github.com/mikolalysenko/typedarray-pool

    bordering: Uint8Array;
    mask1: Uint8Array;

    elevation: Float32Array;
    pos3d: Float32Array;
    posGeo: pointGeoArr;

    color: Float32Array;
    colorDebug: Float32Array;

    ptsPred: Int32Array;
    ptsOrigin: Int32Array;
    ptsNeigh: Set<number>[];
    ptsEdges: [number, number][];
    pts3Vertex: number[];

    conHull: ConvexHull;
    vec3pts: THREE.Vector3[];

    private heap: Heapify;


    constructor(worldData: WorldData) {
        this.data = new TerrainData(worldData);

        this.vec3pts = new Array<THREE.Vector3>()
    }


    public get elevAvg() { return this.data.sphereSize; }
    public get elevMin() { return this.data.altitudeMinProc * this.data.sphereSize; }
    public get elevMax() { return this.data.altitudeMaxProc * this.data.sphereSize; }
    public get elevOcean() { return Convert.lerp(this.elevMin, this.elevMax, this.data.altitudeOceanProc); }
    public get elevMountain() { return Convert.lerp(this.elevMin, this.elevMax, this.data.altitudeMountainProc); }



    public initFromPlanet(planet: Planet) {
        console.debug(`#HERELINE Terrain init `);
        this.orbitElemId = planet.id;
        this.data.sphereSize = planet.radius.km;


        this.clear();
        this.generate();
    }


    public clear() {

    }


    private makeHeap() {
        this.heap?.free();
        this.heap = new Heapify(this.ptsMaxLength);
    }




    private genBasePoints() {
        // var ptsGeo = Points.makeGeoPtsSquares(7);
        var ptsGeo = Points.makeGeoPtsFibb(this.data.pointsToGen);
        // var ptsGeo = Points.makeGeoPoissonDiscSample(this.data.pointsToGen);
        // var ptsGeo = Points.makeGeoPtsRandOk(this.data.pointsToGen);
        // console.log("ptsGeo", ptsGeo);

        this.posGeo = ptsGeo;
        this.ptsLength = ptsGeo.length;
        this.ptsMaxLength = Math.ceil(this.ptsLength * 1.3);
    }


    private genHull() {
        const newVec3Needed = this.ptsLength - this.vec3pts.length;
        for (let index = 0; index < newVec3Needed; index++)
            this.vec3pts.push(new THREE.Vector3());
        for (let index = 0; index < this.ptsLength; index++)
            (this.vec3pts[index] as any).INDEX = index;


        this.pos3d = getFloat32Array(this.ptsLength * 3, this.pos3d);
        this.elevation = getFloat32Array(this.ptsLength, this.elevation);
        for (let index = 0; index < this.ptsLength; index++) {
            const ptGeo = this.posGeo[index];

            var cartPts = Calc.cartesian(ptGeo);
            var rawNoiseVal: number, altChange: number;

            rawNoiseVal = tnoise(...cartPts, this.data, this.noise);
            altChange = Convert.mapLinear(rawNoiseVal, -1, 1, this.elevMin, this.elevMax)

            cartPts = Calc.cartesianRadius(ptGeo, this.elevAvg + altChange);
            this.elevation[index] = altChange;

            this.pos3d[index * 3 + 0] = cartPts[0]
            this.pos3d[index * 3 + 1] = cartPts[1]
            this.pos3d[index * 3 + 2] = cartPts[2]

            cartPts = Calc.cartesianRadius(ptGeo, this.elevAvg);
            this.vec3pts[index].set(...cartPts)

        }

        // for (let index = 0; index < this.pos3d.length; index++) {
        //     const element = this.pos3d[index];
        //     if (isNaN(element))
        //         console.warn({ element, index })
        // }



        const vec3ptsOrigLen = this.vec3pts.length;
        this.vec3pts.length = this.ptsLength;
        this.conHull = new ConvexHull();
        this.conHull.setFromPoints(this.vec3pts)
        // console.log("this.conHull", this.conHull);
        this.vec3pts.length = vec3ptsOrigLen;

        // const gostVerts = []; // TODO 4 in 30k not added this, might cause issues in the future !!!
        // for (const vert of this.conHull.vertices) if (!vert.face) gostVerts.push(vert);
        // console.warn(`${gostVerts.length} vertices belong to no faces :`, gostVerts)


        this.ptsNeigh = new Array<Set<number>>(this.ptsLength)
        for (let index = 0; index < this.ptsLength; index++) {
            this.ptsNeigh[index] = new Set<number>();
            this.vec3pts[index].set(
                this.pos3d[index * 3 + 0],
                this.pos3d[index * 3 + 1],
                this.pos3d[index * 3 + 2],
            )
        }
    }


    private genMeshData() {

        this.pts3Vertex = []; // TODO consider a way to reuse as Float32Array
        const faces = this.conHull.faces;
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            let edge = face.edge;
            do {
                this.pts3Vertex.push((edge.head().point as any).INDEX);
                edge = edge.next;
            } while (edge !== face.edge);
        }

    }


    private genEdgesData() {
        this.ptsEdges = [];
        const faces = this.conHull.faces;
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            let edge = face.edge;
            do {
                this.ptsEdges.push([(edge.head().point as any).INDEX, (edge.next.head().point as any).INDEX])
                edge = edge.next;
            } while (edge !== face.edge);
            // console.log("edges.length", dblEdges.length, i);
        }

        for (const ite of this.ptsEdges) {
            // console.log("ite", ite);
            this.ptsNeigh[ite[1]].add(ite[0]);
            this.ptsNeigh[ite[0]].add(ite[1]);
        }

    }





    private genTectonicPlates() {
        this.genEdgesData();

        const seedPtToIndex = {};
        const randCostsMap = {};
        const randIndexes = [];
        const origCostSeeds = [];

        var tpSeeds = Points.makeGeoPoissonDiscSample(Random.randClampInt(25, 30));
        // var tpSeeds = Points.makeGeoPtsFibb(Random.randClampInt(25, 30));
        // console.log("tpSeeds", tpSeeds);
        // var randIndexes = Random.randIndexes(Random.randClampInt(25, 30), ptsGeo.length)


        var totalPoints = this.posGeo.length;
        var totalPlates = tpSeeds.length;


        console.log("totalPoints", totalPoints);
        console.log("totalPlates", totalPlates);

        var costAvgPlateTiny = Math.ceil(totalPoints / totalPlates / 100 * 6.0)
        var costAvgPlateSmall = Math.ceil(totalPoints / totalPlates / 100 * 4.0)
        var costAvgPlateLarge = Math.ceil(totalPoints / totalPlates / 100 * 3.0)

        console.log("costAvgPlateTiny", costAvgPlateTiny);
        console.log("costAvgPlateSmall", costAvgPlateSmall);
        console.log("costAvgPlateLarge", costAvgPlateLarge);


        for (let cnter = 0; cnter < tpSeeds.length; cnter++) {
            const pt = tpSeeds[cnter];
            const cartPts = Calc.cartesianRadius(pt, this.elevAvg);
            var index = this.findClosest(...cartPts);
            randIndexes.push(index);
            seedPtToIndex[index] = cnter;

            if (Random.randPercent() < 20)
                randCostsMap[index] = costAvgPlateTiny;
            else if (Random.randPercent() < 50)
                randCostsMap[index] = costAvgPlateSmall;
            else
                randCostsMap[index] = costAvgPlateLarge;

            origCostSeeds.push({
                id: index,
                cost: randCostsMap[index],
            })
        }



        var dblEdges = this.ptsEdges
        // var dblEdges = [...this.ptsEdges]
        // for (let index = 0; index < dblEdges.length; index++) {
        //     var rind0 = randCostsMap[dblEdges[index][0]];
        //     var rind1 = randCostsMap[dblEdges[index][1]];
        //     if (isFinite(rind0)) dblEdges[index].push(rind0)
        //     else if (isFinite(rind1)) dblEdges[index].push(rind1)
        // }


        var tree = dju.shortestTreeCustom({
            graph: dblEdges,
            origins: origCostSeeds,
            // origins: randIndexes,
            // directed: false,
        })
        console.log("tree", tree);

        this.ptsPred = tree.predecessor
        this.ptsOrigin = tree.origin

        this.colorTectonicPlates(seedPtToIndex);

    }





    private colorTectonicPlates(seedPtToIndex: any) {

        const color: THREE.Color = new THREE.Color();
        this.color = getFloat32Array(this.ptsLength * 3, this.color);
        for (let index = 0; index < this.ptsOrigin.length; index++) {
            const element = this.ptsOrigin[index];
            const incrInd = seedPtToIndex[element];
            color.set(colorArray[incrInd]);
            // console.log({ element, incrInd, color });
            // if (randIndexes.includes(index))
            //     color.setRGB(1, 0, 0);
            if (this.ptsPred[index] == -1)
                color.setRGB(0, 0, 0);
            this.color[index * 3 + 0] = color.r
            this.color[index * 3 + 1] = color.g
            this.color[index * 3 + 2] = color.b
        }





    }





    private colorTerrain() {

        this.calculate_altitude_colors(this.elevMin, this.elevMax, this.elevOcean)
        this.color = getFloat32Array(this.ptsLength * 3, this.color).fill(0);
        const color: THREE.Color = new THREE.Color();
        for (let index = 0; index < this.ptsLength; index++) {
            // color.set(colorArray[incrInd]);
            var clr = "cyan";

            if ((this.mask1[index] & TerrMask.WATER) == TerrMask.WATER)
                clr = this.gradientWater(this.elevation[index])
            if ((this.mask1[index] & TerrMask.LAND) == TerrMask.LAND)
                clr = this.gradientLand(this.elevation[index])

            if ((this.mask1[index] & TerrMask.WATER) == TerrMask.WATER
                && (this.mask1[index] & TerrMask.LAND) == TerrMask.LAND)
                clr = "red"; // DEBUG !!!!!!

            if ((this.mask1[index] & TerrMask.WATER) != TerrMask.WATER
                && (this.mask1[index] & TerrMask.LAND) != TerrMask.LAND)
                clr = "brown"; // DEBUG !!!!!!




            color.set(clr);
            // console.log({ element, incrInd, color });
            this.color[index * 3 + 0] = color.r
            this.color[index * 3 + 1] = color.g
            this.color[index * 3 + 2] = color.b
        }





    }



    private genMasks() {
        var lowData = this.getLowestElevPoints(this.elevOcean)
        var lowSum = 0, lowCnt = 0;
        for (const ld of lowData.lowestData) {
            lowCnt++;
            lowSum += ld.size;
            // console.log("ld.size", ld.size);
        }
        const avgSize = lowSum / lowCnt;
        // console.log("avgSize", avgSize);

        this.mask1 = getUint8Array(this.ptsLength, this.mask1).fill(0);

        for (const ld of lowData.lowestData) {
            // console.log("ld", ld);
            if (ld.size > avgSize) // mark as WATER only biggest zones under the oceanElev elevation
                for (let index = 0; index < ld.indexesLen; index++) {
                    const element = ld.indexesArr[index];
                    this.mask1[element] |= TerrMask.WATER; // mark water
                }
        }

        // make all non-water land
        for (let index = 0; index < this.ptsLength; index++)
            if ((this.mask1[index] & TerrMask.WATER) != TerrMask.WATER)
                this.mask1[index] |= TerrMask.LAND;


        for (let index = 0; index < this.ptsLength; index++)
            if (this.elevation[index] >= this.elevMountain)
                if ((this.mask1[index] & TerrMask.LAND) == TerrMask.LAND)
                    this.mask1[index] |= TerrMask.MOUNTAIN;


        this.bordering = getUint8Array(this.ptsLength, this.bordering).fill(0);

        for (const [edg1, edg2] of this.ptsEdges) {
            // we only take action on edg1 and just compare edg2
            const msk1 = this.mask1[edg1];
            const msk2 = this.mask1[edg2];
            if ((msk1 & TerrMask.WATER) == TerrMask.WATER)
                if ((msk2 & TerrMask.WATER) != TerrMask.WATER)
                    this.bordering[edg1] |= TerrMask.WATER;
            if ((msk1 & TerrMask.LAND) == TerrMask.LAND)
                if ((msk2 & TerrMask.LAND) != TerrMask.LAND)
                    this.bordering[edg1] |= TerrMask.LAND;
            if ((msk1 & TerrMask.MOUNTAIN) == TerrMask.MOUNTAIN)
                if ((msk2 & TerrMask.MOUNTAIN) != TerrMask.MOUNTAIN)
                    this.bordering[edg1] |= TerrMask.MOUNTAIN;
        }


        this.colorDebug = getFloat32Array(this.ptsLength * 3, this.colorDebug).fill(0);
        for (let index = 0; index < this.ptsLength; index++) {
            if ((this.bordering[index] & TerrMask.MOUNTAIN) == TerrMask.MOUNTAIN)
                this.colorDebug[index * 3 + 0] = 100; // r
            if ((this.bordering[index] & TerrMask.LAND) == TerrMask.LAND)
                this.colorDebug[index * 3 + 1] = 100; // g
            if ((this.bordering[index] & TerrMask.WATER) == TerrMask.WATER)
                this.colorDebug[index * 3 + 2] = 100; // b
        }



        freeFloat32Array(lowData.edgesArr);
    }


    private generate() {
        console.time(`#time Terrain generate`);
        this.noise = Random.makeNoise(this.data.noiseSeed);

        this.genBasePoints();
        this.genHull();
        this.genMeshData();
        this.makeHeap();

        this.genEdgesData();

        this.genMasks();
        this.genCommonPaths();


        this.colorTerrain();
        // this.genTectonicPlates();


        // console.log("this", this);
        console.timeEnd(`#time Terrain generate`);
    }



    public componentToHex = (c) => {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    public rgba = (r, g, b, a) => {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }



    private gradientWater: d3.ScaleLinear<string, string, never>;
    private gradientLand: d3.ScaleLinear<string, string, never>;
    public calculate_altitude_colors = (min: number, max: number, oceanLvl: number) => {
        // https://observablehq.com/@d3/d3-scalelinear
        var rOcean = d3.scaleLinear().domain([0, 100]).range([min, oceanLvl])
        var rLand = d3.scaleLinear().domain([0, 100]).range([oceanLvl, this.elevMountain])
        var rMount = d3.scaleLinear().domain([0, 100]).range([this.elevMountain, max])

        var waterRange = [
            [this.rgba(21, 15, 31, 1), rOcean(0)],
            [this.rgba(21, 15, 131, 1), rOcean(20)],
            [this.rgba(23, 23, 193, 1), rOcean(50)],
            [this.rgba(20, 154, 200, 1), rOcean(80)],
            [this.rgba(200, 181, 19, 1), rOcean(90)],
        ]

        var landRange = [
            [this.rgba(40, 159, 29, 1), rLand(0)],
            [this.rgba(85, 125, 50, 1), rLand(80)],
            [this.rgba(80, 70, 70, 1), rMount(0)],
            [this.rgba(70, 50, 50, 1), rMount(99)],
            [this.rgba(250, 250, 250, 1), rMount(100)],
        ]

        var allRange = [...waterRange, ...landRange]

        this.gradientLand = d3
            .scaleLinear<string, string, never>()
            .domain(landRange.map(d => { return <number>d[1] }))
            .range(landRange.map(d => { return <string>d[0] }))

        this.gradientWater = d3
            .scaleLinear<string, string, never>()
            .domain(allRange.map(d => { return <number>d[1] }))
            .range(allRange.map(d => { return <string>d[0] }))
    }


    makePaths(selectedPoints: number[]) {
        var tree = dju.shortestTreeCustom({
            graph: this.ptsEdges,
            origins: selectedPoints,
            // origins: randIndexes,
            // directed: false,
        })
        // console.log("tree", tree);

        var shPaths = dju.shortest_paths(this.ptsEdges, tree)
        // console.log("shPaths", shPaths);

        return shPaths
    }



    private findClosestVec3 = new THREE.Vector3();
    findClosest(x: number, y: number, z: number, startIndex = 0) {
        this.findClosestVec3.set(x, y, z);
        var minDistInd = startIndex;
        var minDistVal = Infinity;
        var foundCloser = false;

        do {
            foundCloser = false;
            for (const ite of this.ptsNeigh[minDistInd].values()) {
                const vec = this.vec3pts[ite];
                const dist = vec.distanceToSquared(this.findClosestVec3);
                // console.log({ minDistInd, minDistVal, ite, dist });
                if (dist < minDistVal) {
                    foundCloser = true;
                    minDistInd = ite;
                    minDistVal = dist;
                    // break; // TODO consider if should break or not
                }
            }
        } while (foundCloser);
        return minDistInd;
    }


    public getLowestElevPoints(maxElev: number) {
        const valid = getUint8Array(this.ptsLength).fill(0);
        for (let index = 0; index < this.ptsLength; index++) {
            const elev = this.elevation[index];
            if (elev <= maxElev) valid[index] = 1;
        }
        const zonedata = this.getValidZones(valid);
        freeUint8Array(valid);
        return zonedata
    }

    public getHighestElevPoints(minElev: number) {
        const valid = getUint8Array(this.ptsLength).fill(0);
        for (let index = 0; index < this.ptsLength; index++) {
            const elev = this.elevation[index];
            if (elev >= minElev) valid[index] = 1;
        }
        const zonedata = this.getValidZones(valid);
        freeUint8Array(valid);
        return zonedata
    }


    pathToWatter: Float32Array;
    private genCommonPaths() {
        this.pathToWatter = getFloat32Array(this.ptsLength, this.pathToWatter).fill(-1);

        const fifoc = getFloat32Array(this.ptsLength * 2);
        var fifoh = 0, fifot = 0;

        fifoh = fifot = 0;
        for (let index = 0; index < this.ptsLength; index++)
            if ((this.bordering[index] & TerrMask.WATER) == TerrMask.WATER)
                fifoc[fifot++] = index;
        while (fifot - fifoh > 0) {
            const ind = fifoc[fifoh++];
            const elev = this.elevation[ind];
            // if (!this.ptsNeigh[ind]) continue;

            var bestUps = -1;
            for (const nei of this.ptsNeigh[ind]) {
                if ((this.mask1[nei] & TerrMask.LAND) !== TerrMask.LAND) continue; // to land
                if (this.pathToWatter[nei] != -1) continue;// no path there
                const elevNei = this.elevation[nei];
                if (elevNei < elev) continue;
                bestUps = nei;
            }
            if (bestUps != -1) {
                this.pathToWatter[bestUps] = ind;
                fifoc[fifot++] = bestUps;
            }
        }


        freeFloat32Array(fifoc);
    }

    public getRiverOrig() {
        console.time(`#time Terrain getRiverOrig`);
        const minElev = this.elevMountain;
        const valid = getUint8Array(this.ptsLength).fill(0);

        for (let index = 0; index < this.ptsLength; index++)
            if (this.elevation[index] >= minElev) valid[index] = 1;

        for (let index = 0; index < this.ptsLength; index++)
            if (valid[index])
                for (const neigh of this.ptsNeigh[index])
                    if (valid[neigh] == 0) { valid[index] = 2; break; }


        const edgesArr = getFloat32Array(this.ptsEdges.length * 2);
        var edgesLen = 0;

        const fifoc = getFloat32Array(this.ptsLength * 2);
        var fifoh = 0, fifot = 0;

        for (let index = 0; index < this.ptsLength; index++)
            if (valid[index] == 2) {
                fifoc[fifot++] = index;
            }

        while (fifot - fifoh > 0) {
            const ind = fifoc[fifoh++];
            const toWat = this.pathToWatter[ind];
            if (toWat < 0) continue;
            edgesArr[edgesLen++] = ind;
            edgesArr[edgesLen++] = toWat;
            fifoc[fifot++] = toWat;
        }
        // console.log("edgesArr", edgesArr);

        freeFloat32Array(fifoc);
        // const hriv = getFloat32Array(this.ptsLength * 2);
        // var hrivLow = 0, hrivHi = 0;

        // const ploc = getFloat32Array(this.ptsLength).fill(-2);
        // const hloc = getFloat32Array(this.ptsLength);
        // var hlocLow = 0, hlocHi = 0;

        // const riverNext = getFloat32Array(this.ptsLength).fill(-2);
        // const riverPrev = getFloat32Array(this.ptsLength).fill(-2);
        // const riverCost = getFloat32Array(this.ptsLength).fill(0);
        // // -2:nothing -1:origin 0+:downstream to water

        // for (let index = 0; index < this.ptsLength; index++)
        //     if (valid[index] == 2)
        //         hriv[hrivHi++] = index; // river origin some high points

        // while (hrivHi - hrivLow > 0) { // while "heap".len > 0
        //     // const pt = heap[heapLow++]; // same as .shift()
        //     const pt = hriv[--hrivHi]; // same as .pop()
        //     // console.log("pt", pt);

        //     if ((this.mask1[pt] & TerrMask.WATER) == TerrMask.WATER)
        //         continue;

        //     if (riverCost[pt] == 0) {
        //         riverNext[pt] = -1;
        //         riverPrev[pt] = -1;
        //         riverCost[pt] = 1;
        //     }
        //     // else
        //     //     console.warn("riv", riverNext[pt]);

        //     // var foundEnd = -1;
        //     // hlocLow = 0, hlocHi = 0;
        //     // hloc[hlocHi++] = pt;
        //     // ploc[pt] = -1;
        //     // while (foundEnd == -1 || hlocHi - hlocLow > 0) {
        //     //     const ind = hloc[hlocLow++]; // same as .shift()
        //     //     // const ind = hloc[--hlocHi]; // same as .pop()
        //     //     if (!this.ptsNeigh[ind]) continue;
        //     //     for (const neigh of this.ptsNeigh[ind]) {
        //     //         if (ploc[neigh] != -2) continue;
        //     //         hloc[hlocHi++] = neigh;
        //     //         ploc[neigh] = ind;
        //     //         // ploc[ind] = neigh;
        //     //     }
        //     //     if ((this.mask1[ind] & TerrMask.WATER) == TerrMask.WATER) foundEnd = ind;
        //     // }
        //     // // console.log("pt -> foundEnd", pt, foundEnd);
        //     // if (foundEnd >= 0) {
        //     //     edgesArr[edgesLen++] = pt;
        //     //     edgesArr[edgesLen++] = foundEnd;
        //     // }

        //     // var rivSize = 0;
        //     // while (true) {
        //     //     const upstream = ploc[foundEnd]
        //     //     if (upstream < 0) break;
        //     //     if (upstream == foundEnd) break;
        //     //     if (foundEnd == pt) break;
        //     //     if (upstream == pt) break;
        //     //     edgesArr[edgesLen++] = upstream;
        //     //     edgesArr[edgesLen++] = foundEnd;
        //     //     foundEnd = upstream;
        //     //     rivSize++;
        //     // }
        //     // console.log("rivSize, pt -> foundEnd", rivSize, pt, foundEnd);

        //     // // /////////////////////////////////////////////////
        //     // const elev = this.elevation[pt];
        //     // var nextInd = -1;
        //     // var nextElev = elev;
        //     // for (const neigh of this.ptsNeigh[pt]) {
        //     //     const nelev = this.elevation[neigh];
        //     //     if (nelev < nextElev) {
        //     //         nextElev = nelev;
        //     //         nextInd = neigh;
        //     //     }
        //     // }
        //     // if (nextInd != -1) {//found valid downstrem river
        //     //     riverNext[pt] = nextInd;
        //     //     riverPrev[nextInd] = pt;
        //     //     riverCost[nextInd]++;
        //     //     hriv[hrivHi++] = nextInd;
        //     //     edgesArr[edgesLen++] = pt;
        //     //     edgesArr[edgesLen++] = nextInd;
        //     // }
        // }


        // freeFloat32Array(hriv);
        // freeFloat32Array(ploc);
        freeUint8Array(valid);
        console.timeEnd(`#time Terrain getRiverOrig`);
        return { edgesArr, edgesLen };
    }

    public getValidZones(valid: Uint8Array) {
        const zone = getFloat32Array(this.ptsLength).fill(-1);

        // mostly for testing ......
        const edgesArr = getFloat32Array(this.ptsEdges.length * 2).fill(-1);
        var edgesLen = 0;

        const lowestData: { size, minIndex, minElev, indexesArr, indexesLen }[] = [];

        const heap = getFloat32Array(this.ptsLength);
        var heapLow = 0, heapHi = 0;


        var zoneCnt = -1;

        for (let index = 0; index < this.ptsLength; index++) {
            if (valid[index] == 1 && zone[index] == -1) {
                // const indexesArr = getFloat32Array(this.ptsLength).fill(-1); ////////
                const indexesArr = []; ////////

                zoneCnt++; // increase the current zone
                const zoneData = {
                    size: 1,
                    zoneId: zoneCnt,
                    minIndex: index,
                    minElev: this.elevation[index],
                    maxIndex: index,
                    maxElev: this.elevation[index],
                    indexesArr: indexesArr,
                    indexesLen: 0,
                }
                heapLow = heapHi = 0;
                heap[heapHi++] = index;


                while (heapHi - heapLow > 0) { // while "heap".len > 0
                    const pt = heap[heapLow++]; // same as .shift()


                    if (valid[pt] == 0) continue; // valid and not zoned
                    if (zone[pt] != -1) continue; // valid and not zoned

                    // heap[heapHi++] = pt;

                    zoneData.size++;
                    zone[pt] = zoneData.zoneId;
                    // indexesArr[zoneData.indexesLen++] = pt; ////////
                    indexesArr.push(pt); zoneData.indexesLen++; ////////

                    const elev = this.elevation[pt];
                    if (elev < zoneData.minElev) {
                        zoneData.minIndex = pt;
                        zoneData.minElev = elev;
                    }
                    if (elev > zoneData.maxElev) {
                        zoneData.maxIndex = pt;
                        zoneData.maxElev = elev;
                    }

                    for (const neigh of this.ptsNeigh[pt]) {
                        // if (valid[neigh] == 0) continue; // valid and not zoned
                        // if (zone[neigh] != -1) continue; // valid and not zoned
                        heap[heapHi++] = neigh;
                        edgesArr[edgesLen++] = pt;
                        edgesArr[edgesLen++] = neigh;
                    }
                }
                lowestData.push(zoneData);
            }
        }

        freeFloat32Array(heap);
        freeFloat32Array(zone);
        return { lowestData, edgesArr, edgesLen };
    }

    public scanMaskEdges(index: number, mask: number) {
        const hpp: number[] = [];
        const edgesArr = getFloat32Array(this.ptsEdges.length * 2).fill(-1);
        const visited = getUint8Array(this.ptsLength).fill(0);
        var edgesLen = 0;

        hpp.push(index);
        while (hpp.length > 0) {
            const pt = hpp.shift(); // shift() or pop()
            // const pt = hpp.pop(); // shift() or pop()
            for (const neigh of this.ptsNeigh[pt]) {
                if (visited[neigh]) continue;
                visited[neigh] = 1;
                if ((this.mask1[neigh] & mask) != mask) continue;

                hpp.push(neigh);
                edgesArr[edgesLen++] = pt;
                edgesArr[edgesLen++] = neigh;
            }
        }

        freeUint8Array(visited);
        return { edgesArr, edgesLen };
    }


    public scanLand(index: number) {
        return this.scanMaskEdges(index, TerrMask.LAND);
    }

    public scanWater(index: number) {
        return this.scanMaskEdges(index, TerrMask.WATER);
    }






}