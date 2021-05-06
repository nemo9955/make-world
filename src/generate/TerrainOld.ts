
import { Color, colorArray } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
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
// import { D3GeoFull, D3GeoLite, geoConcaveHull } from "../utils/Graph";
// node_modules/@types/noisejs/index.d.ts

// import Delaunator2D from "../utils/delaunator_2d"
// import Delaunator3D from "../utils/delaunator_3d"


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



export class TectonicPlate {
    public readonly id: number;

    public readonly colorId: string;
    public maxSize: number;
    public size: number;
    private overheadValue = 1.1; // make arrays slightly bigger to allow for wiggle

    public latlon: pointGeoArr;
    public readonly position: Float32Array;
    public readonly color: Float32Array;
    public readonly birth: Float32Array;
    public readonly mask: Uint16Array;

    public lines1: Float32Array;
    public linesHull: Float32Array;

    public seedPoint: number = 0;

    public noise: Noise;
    // public readonly edgeIndex: Uint32Array;


    constructor(id: number, minAlocSize: number, noise: Noise) {
        this.id = id;
        this.noise = noise;
        this.size = 0;
        this.maxSize = Math.ceil(minAlocSize * this.overheadValue);
        this.colorId = colorArray[this.id];

        this.position = new Float32Array(this.maxSize * 3);
        this.color = new Float32Array(this.maxSize * 3);
        this.birth = new Float32Array(this.maxSize);
        this.mask = new Uint16Array(this.maxSize);
    }




    public setFromGeo(tkplPoints: pointGeoArr, terrainData: TerrainData) {
        var color: THREE.Color = new THREE.Color();
        var sphSize = terrainData.sphereSize;
        var maxElev = terrainData.altitudeMaxProc * sphSize;
        var minElev = terrainData.altitudeMinProc * sphSize;
        var cartPts: arr3numb;

        this.latlon = tkplPoints;
        this.size = tkplPoints.length;

        color.set(this.colorId);

        for (let index = 0; index < this.size; index++) {
            const stepInd = index * 3;
            const ptGeo = tkplPoints[index];


            // TODO improve this by manually multipling position number with 1.0+ for height
            // or just leave it sphere alligned .....

            cartPts = Calc.cartesianRadius(ptGeo, terrainData.noiseSensitivity);
            var rawNoiseVal: number, altChange: number;
            if (terrainData.noiseApplyAbs) {
                rawNoiseVal = Math.abs(this.noise.perlin3(...cartPts));
                altChange = Convert.mapLinear(rawNoiseVal, 0, 1, minElev, maxElev)
            }
            else {
                rawNoiseVal = this.noise.perlin3(...cartPts);
                altChange = Convert.mapLinear(rawNoiseVal, -1, 1, minElev, maxElev)
            }
            cartPts = Calc.cartesianRadius(ptGeo, sphSize + altChange);

            // console.log(" -------------- ptGeo", ptGeo);

            this.position[stepInd + 0] = cartPts[0]
            this.position[stepInd + 1] = cartPts[1]
            this.position[stepInd + 2] = cartPts[2]

            // this.position[stepInd + 0] = (ptGeo[1]) * 4
            // this.position[stepInd + 1] = rawNoiseVal
            // this.position[stepInd + 2] = (ptGeo[0] - 180) * 4

            // color.setRGB(Math.random(), Math.random(), Math.random());

            // var vx = cartPts[0] / (sphSize + maxElev) + 0.5;
            // var vy = cartPts[1] / (sphSize + maxElev) + 0.5;
            // var vz = cartPts[2] / (sphSize + maxElev) + 0.5;
            // color.setRGB(vx, vy, vz);
            // var col = rawh;
            // color.setRGB(col, col, col);

            // if (randIndexes.includes(index))
            //     color.setRGB(1, 0, 0);

            // this.color[index] = [color.r, color.g, color.b];
            // this.color.push(color.r, color.g, color.b);

            // this.color[stepInd + 0] = rawh
            this.color[stepInd + 0] = color.r
            this.color[stepInd + 1] = color.g
            this.color[stepInd + 2] = color.b
        }


    }


    public setStupedEdges(terrainData: TerrainData) {
        this.lines1 = new Float32Array(this.maxSize * 3 * 2);
        var lsPos = 0;
        for (let index = 0; index < this.size - 1; index++) {
            this.lines1[lsPos++] = this.position[index * 3 + 0] * 1.05
            this.lines1[lsPos++] = this.position[index * 3 + 1] * 1.05
            this.lines1[lsPos++] = this.position[index * 3 + 2] * 1.05
            this.lines1[lsPos++] = this.position[index * 3 + 0 + 3] * 1.05
            this.lines1[lsPos++] = this.position[index * 3 + 1 + 3] * 1.05
            this.lines1[lsPos++] = this.position[index * 3 + 2 + 3] * 1.05

        }

    }

    public setEdges(tkplPrede: number[], terrainData: TerrainData) {
        var lsPos = 0;
        this.lines1 = new Float32Array(this.maxSize * 3 * 2);
        for (let index = 0; index < tkplPrede.length; index++) {
            const predInd = tkplPrede[index];
            if (isNaN(predInd)) { this.setSeedIndex(index); continue; }

            this.lines1[lsPos++] = this.position[index * 3 + 0] * 1.05
            this.lines1[lsPos++] = this.position[index * 3 + 1] * 1.05
            this.lines1[lsPos++] = this.position[index * 3 + 2] * 1.05
            this.lines1[lsPos++] = this.position[predInd * 3 + 0] * 1.05
            this.lines1[lsPos++] = this.position[predInd * 3 + 1] * 1.05
            this.lines1[lsPos++] = this.position[predInd * 3 + 2] * 1.05
        }
    }

    public setEdges2(tkplEdInd: number[], terrainData: TerrainData) {
        // console.log("tkplEdInd", tkplEdInd);
        var lsPos = 0;
        this.lines1 = new Float32Array(tkplEdInd.length * 3 * 2);
        for (let index = 0; index < tkplEdInd.length; index++) {
            const ed1 = tkplEdInd[index];
            const ed2 = tkplEdInd[(index + 1) % tkplEdInd.length];
            // console.log("ed1,ed2", ed1, ed2);

            this.lines1[lsPos++] = this.position[ed1 * 3 + 0] * 1.05
            this.lines1[lsPos++] = this.position[ed1 * 3 + 1] * 1.05
            this.lines1[lsPos++] = this.position[ed1 * 3 + 2] * 1.05
            this.lines1[lsPos++] = this.position[ed2 * 3 + 0] * 1.05
            this.lines1[lsPos++] = this.position[ed2 * 3 + 1] * 1.05
            this.lines1[lsPos++] = this.position[ed2 * 3 + 2] * 1.05
        }
        // console.log("this.lines1", this.lines1);
    }


    public setSeedIndex(seedIndex: number) {
        this.seedPoint = seedIndex;
        this.color[seedIndex * 3 + 0] = 1;
        this.color[seedIndex * 3 + 1] = 1;
        this.color[seedIndex * 3 + 2] = 1;
    }




    public computeHull(terrainData: TerrainData) {
        this.computeHullTriangles2(terrainData);
    }


    public computeHullGeoHull(terrainData: TerrainData) {


        var delaw = Graph.getD3Geo(this.latlon)
        console.log("delaw", delaw);
        const hulen = delaw.hull.length;
        this.linesHull = new Float32Array(hulen * 3 * 2);

        var lsPos = 0;
        for (let index = 0; index < hulen; index++) {
            const geoIndex = delaw.hull[index];
            const geoIndexNext = delaw.hull[(index + 1) % hulen];

            this.linesHull[lsPos++] = this.position[geoIndex * 3 + 0] * 1.05
            this.linesHull[lsPos++] = this.position[geoIndex * 3 + 1] * 1.05
            this.linesHull[lsPos++] = this.position[geoIndex * 3 + 2] * 1.05
            this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 0] * 1.05
            this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 1] * 1.05
            this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 2] * 1.05
        }

    }


    // public computeHullTurf(terrainData: TerrainData) {

    //     var inds = geoConcaveHull(this.latlon);
    //     console.log("inds", inds);

    //     this.linesHull = new Float32Array((inds.length + 1) * 3 * 2);
    //     var lsPos = 0;
    //     for (let index = 0; index < inds.length; index++) {
    //         const geoIndex = inds[index];
    //         const geoIndexNext = inds[(index + 1) % inds.length];
    //         this.linesHull[lsPos++] = this.position[geoIndex * 3 + 0] * 1.05
    //         this.linesHull[lsPos++] = this.position[geoIndex * 3 + 1] * 1.05
    //         this.linesHull[lsPos++] = this.position[geoIndex * 3 + 2] * 1.05
    //         this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 0] * 1.05
    //         this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 1] * 1.05
    //         this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 2] * 1.05

    //     }

    // }



    public computeHullTriangles1(terrainData: TerrainData) {
        var delaw = Graph.getD3Geo(this.latlon, 0)
        console.log("delaw", delaw);

        var count = new Int16Array(this.size);
        for (const iterator of delaw.triangles) {
            count[iterator[0]]++;
            count[iterator[1]]++;
            count[iterator[2]]++;
        }
        console.log("count", count);

        var valid = [];
        for (let index = 0; index < count.length; index++)
            if (count[index] <= 6) valid.push(index)

        console.log("valid", valid);


        this.linesHull = new Float32Array(valid.length * 3 * 2);
        var lsPos = 0;
        for (let index = 0; index < valid.length; index++) {
            const geoIndex = valid[index];
            const geoIndexNext = valid[(index + 1) % valid.length];
            this.linesHull[lsPos++] = this.position[geoIndex * 3 + 0] * 1.08
            this.linesHull[lsPos++] = this.position[geoIndex * 3 + 1] * 1.08
            this.linesHull[lsPos++] = this.position[geoIndex * 3 + 2] * 1.08
            this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 0] * 1.08
            this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 1] * 1.08
            this.linesHull[lsPos++] = this.position[geoIndexNext * 3 + 2] * 1.08

        }
    }


    public computeHullTriangles2(terrainData: TerrainData) {
        var delaw = Graph.getD3Geo(this.latlon, 0)
        var tris = delaw.triangles

        this.linesHull = new Float32Array(tris.length * 3 * 2);
        var lsPos = 0;
        for (let index = 0; index < tris.length; index++) {
            const geoInd1 = tris[index][0];
            const geoInd2 = tris[index][1];
            const geoInd3 = tris[index][2];
            this.linesHull[lsPos++] = this.position[geoInd1 * 3 + 0] * 1.08
            this.linesHull[lsPos++] = this.position[geoInd1 * 3 + 1] * 1.08
            this.linesHull[lsPos++] = this.position[geoInd1 * 3 + 2] * 1.08
            this.linesHull[lsPos++] = this.position[geoInd2 * 3 + 0] * 1.08
            this.linesHull[lsPos++] = this.position[geoInd2 * 3 + 1] * 1.08
            this.linesHull[lsPos++] = this.position[geoInd2 * 3 + 2] * 1.08

        }
    }



    public computeHullContour(terrainData: TerrainData) {
        var llCont = [...this.latlon]
        for (const iterator of llCont)
            iterator.push(1)
        for (const iterator of this.latlon) {
            llCont.push(Calc.wrapLatLon([iterator[0] + 180, iterator[1]]).push(0) as any)
        }
        // iterator.push(1)

        // console.log("llCont", llCont);

        var contObj = geoContour();
        // contObj.value((obj_, ind_) => { return 1; })
        // console.log("contObj", contObj);


        // d3.geoContour

        // var cont = contObj.thresholds([0, 0.5, 0., 1, 2])
        var cont = contObj.contour(llCont, 1)
        // cont = [...cont]
        console.log("cont", cont);

    }


    /**
     * dispose
     */
    public dispose() {

    }


}

export type TerrainData = {
    sphereSize: number,
    altitudeMinProc: number,
    altitudeMaxProc: number,
    pointsToGen: number,
    noiseSeed: number,
    noiseSensitivity: number,
    noiseApplyAbs: boolean,
}

export class Terrain extends Identifiable {

    public data: TerrainData = {
        sphereSize: 1000,
        altitudeMinProc: -0.1, // How mutch the altitude will varry proportional to sphereSize
        altitudeMaxProc: +0.1, // How mutch the altitude will varry proportional to sphereSize
        pointsToGen: 1000 * 10,
        noiseSensitivity: 2,
        noiseApplyAbs: false,
        noiseSeed: Math.random(),
    }


    public orbitElemId: number = null;
    private noise: Noise;

    public tkplCurId: number = 0;
    public tkplCnt: number = 0;

    public tkplates: Array<TectonicPlate>;

    constructor(worldData: WorldData) {
        super(worldData);
        this.tkplates = new Array<TectonicPlate>();
    }

    public init(planet: Planet, doExperiment: boolean) {
        console.debug(`#HERELINE Terrain init doExperiment:${doExperiment}`);
        this.orbitElemId = planet.id;
        this.data.sphereSize = planet.radius.km;
        // this.tData.noiseSeed = Math.random();
        this.resetTkpl();

        if (doExperiment)
            this.experiment();
        else
            this.generate();
    }

    public experiment() {
        var ptsGeo = Points.makeGeoPtsFibb(this.data.pointsToGen);
        // var ptsGeo = Points.makeGeoPoissonDiscSample(this.tData.pointsToGen);
        // var ptsGeo = Points.makeGeoPtsRandOk(this.tData.pointsToGen);

        var pts2d = new Float64Array(ptsGeo.length * 2);
        var pts3d = new Float64Array(ptsGeo.length * 3);


        for (let index = 0; index < ptsGeo.length; index++) {
            const element = ptsGeo[index];
            pts2d[index * 2 + 0] = element[0];
            pts2d[index * 2 + 1] = element[1];

            const cartPts = Calc.cartesianRadius(element, 5000);
            pts3d[index * 3 + 0] = cartPts[0];
            pts3d[index * 3 + 1] = cartPts[1];
            pts3d[index * 3 + 2] = cartPts[2];
        }




    }

    public generate() {
        console.time(`#time Terrain generate`);
        this.noise = Random.makeNoise(this.data.noiseSeed);

        // var ptsGeo = Points.makeGeoPtsSquares(0);
        var ptsGeo = Points.makeGeoPtsFibb(this.data.pointsToGen);
        // var ptsGeo = Points.makeGeoPoissonDiscSample(this.tData.pointsToGen);
        // var ptsGeo = Points.makeGeoPtsRandOk(this.tData.pointsToGen);
        // console.log("ptsGeo", ptsGeo);

        // TODO generate full number of points after basic Tectonic plates are calculated
        // to avoid running d3GeoWrapper/geoDelaunay on high number of points
        // var delawBig = new d3GeoWrapper(ptsGeo) // verry big nom=nom on resources ...
        var delaw = Graph.getD3Geo(ptsGeo) // verry big nom=nom on resources ...
        console.log("delaw", delaw);

        var randIndexes = [];
        var seedPtToIndex = {}, cnter = 0;
        var randCostsMap = {};

        // var tpSeeds = Points.makeGeoPoissonDiscSample(Random.randClampInt(25, 30));
        var tpSeeds = Points.makeGeoPtsFibb(Random.randClampInt(25, 30));
        // console.log("tpSeeds", tpSeeds);

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


        for (const pt of tpSeeds) {
            var index = delaw.find(pt[0], pt[1]);
            randIndexes.push(index);
            seedPtToIndex[index] = cnter++;

            if (Random.randPercent() < 20)
                randCostsMap[index] = costAvgPlateTiny;
            else if (Random.randPercent() < 50)
                randCostsMap[index] = costAvgPlateSmall;
            else
                randCostsMap[index] = costAvgPlateLarge;

            // if (randIndexes.length % 4 == 0)
            //     randCostsMap[index] = costAvgPlateTiny;
            // else if (randIndexes.length % 2 == 0)
            //     randCostsMap[index] = costAvgPlateSmall;
            // else
            //     randCostsMap[index] = costAvgPlateLarge;

            // console.log("randCostsMap[index]", randIndexes.length - 1, randCostsMap[index]);
            // randCostsMap[index] = Random.wiggleInt(costAvgPlateLarge, costAvgPlateLarge / 15);
            // if (randIndexes.length % 2 == 0)
            //     randCostsMap[index] = Random.random_int_clamp(10, 20);
            // else
            //     randCostsMap[index] = Random.random_int_clamp(1, 5);
            // randCostsMap[index] = Random.random_int_clamp(1, 10);
            // randCostsMap[index] = 1;
            // TODO compute randCosts values from total points and seeds !!!!
        }

        // var randIndexes = Random.randIndexes(Random.random_int_clamp(5, 10), ptsGeo.length);
        // console.log("randIndexes", randIndexes);
        // console.log("seedPtToIndex", seedPtToIndex);
        // console.log("randCostsMap", randCostsMap);

        var dblEdges = delaw.edges
        for (let index = 0; index < dblEdges.length; index++) {
            var rind0 = randCostsMap[dblEdges[index][0]];
            var rind1 = randCostsMap[dblEdges[index][1]];
            if (isFinite(rind0)) dblEdges[index].push(rind0)
            else if (isFinite(rind1)) dblEdges[index].push(rind1)
        }


        var tree = dju.shortestTreeCustom({
            graph: dblEdges,
            origins: randIndexes,
            directed: false,
        })
        console.log("tree", tree);


        var globToLocal = new Int16Array(totalPoints);
        var isGlobEdge = new Int8Array(totalPoints);
        const platesNeigh = {}
        const tkplMapPoints = {}
        const tkplMapEdges = {}
        const tkplMapSeeds = {}
        for (const iterator of randIndexes) {
            platesNeigh[iterator] = {};
            tkplMapPoints[iterator] = [];
            tkplMapEdges[iterator] = new Set();
        }


        for (let index = 0; index < tree.origin.length; index++) {
            const tpIndex = tree.origin[index];
            var geoPt = ptsGeo[index];
            tkplMapPoints[tpIndex].push(geoPt);
            globToLocal[index] = tkplMapPoints[tpIndex].length - 1;

            if (tree.predecessor[index] == -1)
                tkplMapSeeds[tpIndex] = tkplMapPoints[tpIndex].length - 1;
        }


        for (let index = 0; index < dblEdges.length; index++) {
            const ed1 = dblEdges[index][0];
            const ed2 = dblEdges[index][1];
            const or1 = tree.origin[ed1];
            const or2 = tree.origin[ed2];
            if (or1 == or2) continue;
            platesNeigh[or1][or2] = true;
            platesNeigh[or2][or1] = true;
            isGlobEdge[ed1] = 1;
            isGlobEdge[ed2] = 1;
            tkplMapEdges[or1].add(globToLocal[ed1]);
            tkplMapEdges[or2].add(globToLocal[ed2]);
        }



        // console.log("tmpTkplData", tkplMapPoints);
        // console.log("ptToTkpl", ptToTkpl);


        for (const iterator of randIndexes) {
            var tkplPoints = tkplMapPoints[iterator];
            var tkplPtSize = tkplMapPoints[iterator].length;

            if (tkplPoints.length <= 2) continue;

            // console.log("tkplPoints", tkplPoints);

            var tkplObject = new TectonicPlate(this.newTkplId(), tkplPtSize, this.noise)
            tkplObject.setFromGeo(tkplPoints, this.data);

            // tkplObject.setEdges(tkplMapPredecesor[iterator], this.tData);
            // tkplObject.setStupedEdges(this.tData);
            // tkplObject.computeHull(this.tData);
            tkplObject.setEdges2([...tkplMapEdges[iterator].values()], this.data);

            tkplObject.setSeedIndex(tkplMapSeeds[iterator]);
            this.addTkpl(tkplObject)
            // break;
        }



        console.timeEnd(`#time Terrain generate`);
    }

    private resetTkpl() {
        this.tkplCurId = 0;
        this.tkplCnt = 0;
        while (this.tkplates.length > 0) {
            var poped = this.tkplates.pop();
            poped.dispose()
        }
    }

    private addTkpl(tkplObj: TectonicPlate) {
        this.tkplCnt++;
        this.tkplates.push(tkplObj);
    }


    private newTkplId(): number {
        return this.tkplCurId++;
    }


    public getPlanet(): Planet {
        if (!this.orbitElemId) return null;
        return this.getWorldData().getRwObj(this.orbitElemId)
    }

    // public static initForPlanet(planet_: Planet) {
    //     console.debug(`#HERELINE Terrain initForPlanet `);
    //     console.log("planet_", planet_);
    //     var terrain = new Terrain(planet_.getWorldData());
    //     terrain.orbitElemId = planet_.id;
    //     console.log("terrain", terrain);
    //     terrain.getWorldData().setBigIdObject(terrain)
    // }

    // // public clone() { return new Terrain(this.getWorldData()).copyLogic(this) }
    // public static clone(worldData: WorldData, data_: any) { return new Terrain(worldData).copyDeep(data_) }









    // for (let index = 0; index < ptsGeo.length; index++) {
    //     const stepInd = index * 3
    //     const ptGeo = ptsGeo[index];

    //     cartPts = Points.cartesianRadius(ptGeo, 2);
    //     const rawh = Math.abs(this.noise.perlin3(...cartPts));
    //     var elev = rawh * maxElev;
    //     cartPts = Points.cartesianRadius(ptGeo, sphSize - elev);

    //     // console.log(" -------------- ptGeo", ptGeo);

    //     this.position[stepInd + 0] = cartPts[0]
    //     this.position[stepInd + 1] = cartPts[1]
    //     this.position[stepInd + 2] = cartPts[2]

    //     // this.position[stepInd + 0] = (ptGeo[1]) * 4
    //     // this.position[stepInd + 1] = elev
    //     // this.position[stepInd + 2] = (ptGeo[0] - 180) * 4

    //     // color.setRGB(Math.random(), Math.random(), Math.random());

    //     // var vx = cartPts[0] / (sphSize + maxElev) + 0.5;
    //     // var vy = cartPts[1] / (sphSize + maxElev) + 0.5;
    //     // var vz = cartPts[2] / (sphSize + maxElev) + 0.5;
    //     // color.setRGB(vx, vy, vz);
    //     var col = rawh;
    //     color.setRGB(col, col, col);

    //     if (randIndexes.includes(index))
    //         color.setRGB(1, 0, 0);

    //     // this.color[index] = [color.r, color.g, color.b];
    //     // this.color.push(color.r, color.g, color.b);

    //     this.color[stepInd + 0] = color.r
    //     this.color[stepInd + 1] = color.g
    //     this.color[stepInd + 2] = color.b
    // }


    // ptsLines = new d3GeoWrapper(ptsGeo).getVoroLineSegsCart(this.position);
    // var graph = new Graph().mkUndirGeo(ptsGeo);




    // var lsPos = 0;
    // var ptsLines = new Float32Array(ptsGeo.length * 2 * 3)
    // for (let index = 0; index < tree.predecessor.length; index++) {
    //     const element = tree.predecessor[index];
    //     // for (let index = 0; index < tree.origin.length; index++) {
    //     //     const element = tree.origin[index];
    //     if (element == -1) continue;

    //     ptsLines[lsPos++] = this.position[index * 3 + 0]
    //     ptsLines[lsPos++] = this.position[index * 3 + 1]
    //     ptsLines[lsPos++] = this.position[index * 3 + 2]
    //     ptsLines[lsPos++] = this.position[element * 3 + 0]
    //     ptsLines[lsPos++] = this.position[element * 3 + 1]
    //     ptsLines[lsPos++] = this.position[element * 3 + 2]
    // }


    // for (let index = 0; index < this.position.length; index++) {
    //     this.position[index] *= 0.9;
    // }

    // console.log("ptsGeo", ptsGeo);
    // console.log("this.position", this.position);
    // console.log("ptsLines", ptsLines);
    // console.log("this.color", this.color);

    public clone() { return new Terrain(this.getWorldData()).copyLogic(this) }
    public static clone(worldData: WorldData, data_: any) { return new Terrain(worldData).copyDeep(data_) }
    static get type() { return `Terrain` }

}