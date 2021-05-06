
import { Color, colorArray } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { freeFloat32Array, getFloat32Array, ObjectPool } from "../utils/ObjectPool";
import { WorldData } from "../modules/WorldData";
import { Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";
import { PlanetarySystem } from "./PlanetarySystem";
import { Planet } from "./Planet";
import { Identifiable } from "../modules/ObjectsHacker";


import { pointGeoArr, pointGeo, arr3numb } from "../utils/Points";
import * as Points from "../utils/Points"
import * as Calc from "../utils/Calc"

import * as THREE from "three";
import * as dju from "../utils/dij_utils";
import { geoDelaunay, geoVoronoi, geoContour } from "d3-geo-voronoi"

import * as d3 from "d3"
import * as Graph from "../utils/Graph";



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


function tnoise(x: number, y: number, z: number, data: TerrainData, noise: Noise): number {
    // Convert.mapLinear(rawNoiseVal, 0, 1, minElev, maxElev)

    var value = 0.0;
    for (let octave = 0; octave < data.noiseOctaves; octave++) {
        const freq = data.noiseFrequency * Math.pow(2, octave);
        value += noise.perlin3(x * freq, y * freq, z * freq) *
            (data.noiseAmplitude * Math.pow(data.noisePersistence, octave));
    }
    value = value / (2 - 1 / Math.pow(2, data.noiseOctaves - 1));
    // this.noise.perlin3(x, y, z)

    value = Math.pow(value, data.noiseExponent);

    if (data.noiseApplyAbs)
        value = ((1 - Math.abs(value)) * 2) - 1

    // console.log("value", value);
    return value
}



export class TerrainData extends Identifiable {

    sphereSize: number;
    altitudeMinProc: number;
    altitudeMaxProc: number;
    pointsToGen: number;
    noiseSeed: number;
    noiseApplyAbs: boolean;
    noiseOctaves: number;
    noiseFrequency: number;
    noiseAmplitude: number;
    noisePersistence: number;
    noiseExponent: number;

    constructor(worldData: WorldData) {
        super(worldData);

        this.sphereSize = 1000;
        this.pointsToGen = 1000 * 50;
        this.altitudeMinProc = -0.03;
        this.altitudeMaxProc = +0.03;
        this.noiseApplyAbs = false;
        this.noiseSeed = Math.random();

        this.noiseFrequency = 2;
        this.noiseAmplitude = 2.0;
        this.noiseOctaves = 5;
        this.noisePersistence = 0.6;
        this.noiseExponent = 1.0;


    }

    public clone() { return new TerrainData(this.getWorldData()).copyLogic(this) }
    public static clone(worldData: WorldData, data_: any) { return new TerrainData(worldData).copyDeep(data_) }
    static get type() { return `TerrainData` }
}

export class Terrain {

    data: TerrainData;
    public orbitElemId: number = null;
    private noise: Noise;
    relief_gradient: d3.ScaleLinear<string, string, never>;

    get world() { return this.data.getWorldData(); }
    get id() { return this.data.id; }

    ptsLength: number
    ptsMaxLength: number

    // TODO use a typedArray pool like https://github.com/mikolalysenko/typedarray-pool

    elevation: Float32Array;
    pos3d: Float32Array;
    posGeo: pointGeoArr;

    color: Float32Array;

    ptsPred: Int32Array;
    ptsOrigin: Int32Array;
    ptsNeigh: Set<number>[];
    ptsEdges: [number, number][];
    pts3Vertex: number[];

    conHull: ConvexHull;
    vec3pts: THREE.Vector3[];


    constructor(worldData: WorldData) {
        this.data = new TerrainData(worldData);

        this.vec3pts = new Array<THREE.Vector3>()
    }


    public initFromPlanet(planet: Planet) {
        console.debug(`#HERELINE Terrain init `);
        this.orbitElemId = planet.id;
        this.data.sphereSize = planet.radius.km;

        this.clear();
        this.generate();
    }

    public clear() {

    }




    private generate() {
        console.time(`#time Terrain generate`);
        this.noise = Random.makeNoise(this.data.noiseSeed);

        // var ptsGeo = Points.makeGeoPtsSquares(7);
        var ptsGeo = Points.makeGeoPtsFibb(this.data.pointsToGen);
        // var ptsGeo = Points.makeGeoPoissonDiscSample(this.data.pointsToGen);
        // var ptsGeo = Points.makeGeoPtsRandOk(this.data.pointsToGen);
        // console.log("ptsGeo", ptsGeo);

        this.posGeo = ptsGeo;
        this.ptsLength = ptsGeo.length;
        this.ptsMaxLength = Math.ceil(this.ptsLength * 1.3);


        const color: THREE.Color = new THREE.Color();
        const sphSize = this.data.sphereSize;
        const maxElev = this.data.altitudeMaxProc * sphSize;
        const minElev = this.data.altitudeMinProc * sphSize;

        this.pos3d = getFloat32Array(this.ptsLength * 3, this.pos3d);
        this.elevation = getFloat32Array(this.ptsLength, this.elevation);

        var colorId = colorArray[0]; color.set(colorId);

        const newVec3Needed = this.ptsLength - this.vec3pts.length;
        console.log("newVec3Needed", newVec3Needed);
        for (let index = 0; index < newVec3Needed; index++)
            this.vec3pts.push(new THREE.Vector3());
        for (let index = 0; index < this.ptsLength; index++)
            (this.vec3pts[index] as any).INDEX = index;


        for (let index = 0; index < this.ptsLength; index++) {
            const ptGeo = ptsGeo[index];

            var cartPts = Calc.cartesian(ptGeo);
            var rawNoiseVal: number, altChange: number;
            // if (this.data.noiseApplyAbs) {
            //     rawNoiseVal = Math.abs(this.noise.perlin3(...cartPts));
            //     altChange = Convert.mapLinear(rawNoiseVal, 0, 1, minElev, maxElev)
            // }
            // else {
            //     rawNoiseVal = this.noise.perlin3(...cartPts);
            //     altChange = Convert.mapLinear(rawNoiseVal, -1, 1, minElev, maxElev)
            // }
            rawNoiseVal = tnoise(...cartPts, this.data, this.noise);
            altChange = Convert.mapLinear(rawNoiseVal, -1, 1, minElev, maxElev)

            const elevation_ = sphSize + altChange;
            cartPts = Calc.cartesianRadius(ptGeo, elevation_);
            this.elevation[index] = altChange;

            this.pos3d[index * 3 + 0] = cartPts[0]
            this.pos3d[index * 3 + 1] = cartPts[1]
            this.pos3d[index * 3 + 2] = cartPts[2]

            cartPts = Calc.cartesianRadius(ptGeo, sphSize);
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
        console.log("this.conHull", this.conHull);
        this.vec3pts.length = vec3ptsOrigLen;



        this.ptsNeigh = new Array<Set<number>>(this.ptsLength)
        for (let index = 0; index < this.ptsLength; index++) {
            this.ptsNeigh[index] = new Set<number>();
            this.vec3pts[index].set(
                this.pos3d[index * 3 + 0],
                this.pos3d[index * 3 + 1],
                this.pos3d[index * 3 + 2],
            )
        }

        this.ptsEdges = [];
        this.pts3Vertex = [];
        const faces = this.conHull.faces;
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            let edge = face.edge;
            do {
                this.pts3Vertex.push((edge.head().point as any).INDEX);
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


        // console.log("vertexIndexes", vertexIndexes);
        // console.log("edgesIndexes", edgesIndexes);

        // const mesColAttr = new THREE.Float32BufferAttribute(this.terrain.color, 3);
        // mesColAttr.count = this.terrain.ptsLength;
        // ptsGeometry.setAttribute('color', mesColAttr);


        // console.log("edges", dblEdges);

        const seedPtToIndex = {};
        const randCostsMap = {};
        const randIndexes = [];
        const origCostSeeds = [];

        var tpSeeds = Points.makeGeoPoissonDiscSample(Random.randClampInt(25, 30));
        // var tpSeeds = Points.makeGeoPtsFibb(Random.randClampInt(25, 30));
        // console.log("tpSeeds", tpSeeds);
        // var randIndexes = Random.randIndexes(Random.randClampInt(25, 30), ptsGeo.length)


        var totalPoints = ptsGeo.length;
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
            const cartPts = Calc.cartesianRadius(pt, sphSize);
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


        // this.color = getFloat32Array(this.ptsLength * 3, this.color);
        // for (let index = 0; index < tree.origin.length; index++) {
        //     const element = tree.origin[index];
        //     const incrInd = seedPtToIndex[element];
        //     color.set(colorArray[incrInd]);
        //     // console.log({ element, incrInd, color });
        //     // if (randIndexes.includes(index))
        //     //     color.setRGB(1, 0, 0);
        //     if (tree.predecessor[index] == -1)
        //         color.setRGB(0, 0, 0);
        //     this.color[index * 3 + 0] = color.r
        //     this.color[index * 3 + 1] = color.g
        //     this.color[index * 3 + 2] = color.b
        // }

        this.calculate_altitude_colors(minElev, maxElev)
        // var seq = d3.scaleSequential([minElev, maxElev], d3.interpolateTurbo).interpolator()

        // var seq = d3
        //     .scaleSequential<string, string, never>(["blue", "green"])
        //     // .scaleSequential(["black", "blue", "yellow", "green", "white"])
        //     .rangeRound([minElev, maxElev])


        var seq = d3.scaleLinear<string, string, never>()
            .domain([minElev, minElev * 0.5, 0, maxElev * 0.5, maxElev])
            .range(["black", "blue", "yellow", "green", "white"])

        // console.log("[minElev, 0, maxElev]", [minElev, 0, maxElev]);
        // console.log("this.elevation", this.elevation);

        this.color = getFloat32Array(this.ptsLength * 3, this.color);
        for (let index = 0; index < tree.origin.length; index++) {
            const element = tree.origin[index];
            const incrInd = seedPtToIndex[element];
            // color.set(colorArray[incrInd]);


            const clr = this.relief_gradient(this.elevation[index])
            // const clr = seq(this.elevation[index])
            // const clr = seq(this.elevation[index])
            color.set(clr);



            // console.log({ element, incrInd, color });
            // if (randIndexes.includes(index))
            //     color.setRGB(1, 0, 0);
            if (tree.predecessor[index] == -1)
                color.setRGB(0, 0, 0);
            this.color[index * 3 + 0] = color.r
            this.color[index * 3 + 1] = color.g
            this.color[index * 3 + 2] = color.b
        }









        // console.log("this.pos3d", this.pos3d);
        // console.log("this.color", this.color);

        // // TODO generate full number of points after basic Tectonic plates are calculated
        // // to avoid running d3GeoWrapper/geoDelaunay on high number of points
        // // var delawBig = new d3GeoWrapper(ptsGeo) // verry big nom=nom on resources ...
        // var delaw = Graph.getD3Geo(ptsGeo) // verry big nom=nom on resources ...
        // console.log("delaw", delaw);


        console.log("this", this);
        console.timeEnd(`#time Terrain generate`);
    }



    public componentToHex = (c) => {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    public rgba = (r, g, b, a) => {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    public calculate_altitude_colors = (min: number, max: number) => {

        var rel_sc = d3.scaleLinear().domain([0, 100]).range([min, max])
        var sc_data = [
            [this.rgba(21, 15, 131, 1), rel_sc(0)],
            [this.rgba(23, 23, 193, 1), rel_sc(22)],
            [this.rgba(20, 154, 200, 1), rel_sc(36)],
            [this.rgba(200, 181, 29, 1), rel_sc(43)],
            [this.rgba(31, 182, 46, 1), rel_sc(52)],
            [this.rgba(40, 159, 29, 1), rel_sc(70)],
            [this.rgba(80, 70, 70, 1), rel_sc(85)],
            [this.rgba(70, 50, 50, 1), rel_sc(90)],
        ]

        // console.log(sc_data)
        this.relief_gradient = d3
            .scaleLinear<string, string, never>()
            .domain(sc_data.map(d => { return <number>d[1] }))
            .range(sc_data.map(d => { return <string>d[0] }))
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

    // raycaster: THREE.Raycaster = new THREE.Raycaster();
    // findClosest(x, y, z) {
    //     this.raycaster.ray.origin.set(x, y, z).multiplyScalar(0.5);
    //     this.raycaster.ray.direction.set(x, y, z).multiplyScalar(1.5);
    //     this.raycaster.params.Points.threshold = 50;
    //     this.raycaster.params.Line.threshold = 50;
    //     this.raycaster.intersectObject(this.ptsObject)
    //     // this.conHull.tolerance
    // }



}