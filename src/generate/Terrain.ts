
import { Color } from "../utils/Color"
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


import { pointGeoArr, arr3numb } from "../utils/Points";
import * as Points from "../utils/Points"

import * as THREE from "three";
import * as dju from "../utils/dij_utils";

import * as d3 from "d3"
import { d3GeoWrapper, Graph } from "../utils/Graph";
// node_modules/@types/noisejs/index.d.ts



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



// http://jnnnnn.github.io/category-colors-constrained.html // meh ....
const colorArray = [
    ...d3.schemeCategory10,
    ...d3.schemeAccent,
    ...d3.schemeTableau10,
]


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

    public setFromGeo(tkplPoints: pointGeoArr) {
        var color: THREE.Color = new THREE.Color();
        var sphSize = 500;
        var maxElev = 50;
        var cartPts: arr3numb;

        this.latlon = tkplPoints;
        this.size = tkplPoints.length;

        for (let index = 0; index < tkplPoints.length; index++) {
            const stepInd = index * 3
            const ptGeo = tkplPoints[index];


            // TODO improve this by manually multipling position number with 1.0+ for height
            // or just leave it sphere alligned .....

            cartPts = Points.cartesianRadius(ptGeo, 2);
            const rawh = Math.abs(this.noise.perlin3(...cartPts));
            var elev = rawh * maxElev;
            cartPts = Points.cartesianRadius(ptGeo, sphSize - elev);

            // console.log(" -------------- ptGeo", ptGeo);

            this.position[stepInd + 0] = cartPts[0]
            this.position[stepInd + 1] = cartPts[1]
            this.position[stepInd + 2] = cartPts[2]

            // this.position[stepInd + 0] = (ptGeo[1]) * 4
            // this.position[stepInd + 1] = elev
            // this.position[stepInd + 2] = (ptGeo[0] - 180) * 4

            // color.setRGB(Math.random(), Math.random(), Math.random());

            // var vx = cartPts[0] / (sphSize + maxElev) + 0.5;
            // var vy = cartPts[1] / (sphSize + maxElev) + 0.5;
            // var vz = cartPts[2] / (sphSize + maxElev) + 0.5;
            // color.setRGB(vx, vy, vz);
            // var col = rawh;
            // color.setRGB(col, col, col);
            color.set(this.colorId);

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


}



export class Terrain extends Identifiable {

    public orbitElemId: number = null;
    private noise: Noise;

    public tkplCurId: number = 0;
    public tkplCnt: number = 0;

    public tkplates: Array<TectonicPlate>;

    constructor(worldData: WorldData) {
        super(worldData);
        this.tkplates = new Array<TectonicPlate>();
    }






    public init() {
        console.time(`#time Terrain init`);
        this.noise = Random.makeNoise(Math.random());

        // var ptsGeo = Points.makeGeoPtsSquares(0);
        var ptsGeo = Points.makeGeoPtsFibb(1000 * 10);
        // var ptsGeo = Points.makeGeoPoissonDiscSample(1000 * 10);
        // var ptsGeo = Points.makeGeoPtsRandOk(1000 * 50);
        // var ptsGeo = Points.makeGeoPoissonDiscSample(1000);

        // var this.position = new Float32Array(ptsGeo.length * 3)
        // var this.color = new Float32Array(ptsGeo.length * 3)



        var del = new d3GeoWrapper(ptsGeo)



        var randIndexes = [];
        var randCosts = [];
        var tpSeeds = Points.makeGeoPoissonDiscSample(Random.random_int_clamp(10, 20));
        for (const pt of tpSeeds) {
            // cartPts = Points.cartesianRadius(ptGeo, 2);
            var index = del.find(pt[0], pt[1]);
            randIndexes.push(index);
            // randCosts.push(Random.random_int_clamp(1, 50));
            // TODO compute randCosts values from total points and seeds !!!!
            if (randIndexes.length % 2 == 0)
                // randCosts.push(Random.random_int_clamp(5, 10));
                randCosts.push(Random.random_int_clamp(10, 20));
            else
                randCosts.push(Random.random_int_clamp(1, 5));
            // TODO compute randCosts values from total points and seeds !!!!
        }

        // var randIndexes = Random.randIndexes(Random.random_int_clamp(5, 10), ptsGeo.length);
        console.log("randIndexes", randIndexes);
        console.log("randCosts", randCosts);

        var dblEdges = [...del.edges]
        for (const edg of del.edges) dblEdges.push([edg[1], edg[0]])
        for (let index = 0; index < dblEdges.length; index++) {
            var rind0 = randIndexes.indexOf(dblEdges[index][0]);
            var rind1 = randIndexes.indexOf(dblEdges[index][1]);
            if (rind0 >= 0) dblEdges[index].push(randCosts[rind0])
            else if (rind1 >= 0) dblEdges[index].push(randCosts[rind1])
            // if (rind0 >= 0 || rind1 >= 0) {
            //     console.log("rind0,rind1", rind0, rind1, dblEdges[index]);
            // }
        }



        var tree = dju.shortestTreeCustom({
            graph: dblEdges,
            origins: randIndexes,
        })
        console.log("tree", tree);


        var tmpTkplData = {}
        for (const iterator of randIndexes)
            tmpTkplData[iterator] = []


        for (let index = 0; index < tree.origin.length; index++) {
            const tpIndex = tree.origin[index];
            var geoPt = ptsGeo[index];
            tmpTkplData[tpIndex].push(geoPt);
        }
        console.log("tmpTkplData", tmpTkplData);



        for (const iterator of randIndexes) {
            var tkplPoints = tmpTkplData[iterator];
            var tkplPtSize = tmpTkplData[iterator].length;

            var tkplObject = new TectonicPlate(this.newTkplId(), tkplPtSize, this.noise)
            tkplObject.setFromGeo(tkplPoints);
            this.addTkpl(tkplObject)
        }

        console.log("this", this);

        console.timeEnd(`#time Terrain init`);
    }


    private addTkpl(tkplObj: TectonicPlate) {
        this.tkplCnt++;
        this.tkplates.push(tkplObj);
    }


    private newTkplId(): number {
        return this.tkplCurId++;
    }


    // public getOrbitingElement(): OrbitingElement {
    //     if (!this.orbitElemId) return null;
    //     return this.getWorldData().idObjMap.get(this.orbitElemId)
    // }

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

}