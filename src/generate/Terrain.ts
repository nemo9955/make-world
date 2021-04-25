
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

import noise_lib = require("noisejs")
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



export class TectonicPlate extends Identifiable {
    public maxSize: number;
    public size: number;
    private overheadValue = 1.1; // make arrays slightly bigger to allow for wiggle

    public readonly position: Float32Array;
    public readonly color: Float32Array;
    public readonly birth: Float32Array;
    public readonly mask: Uint16Array;

    // public readonly edgeIndex: Uint32Array;
}



export class Terrain extends Identifiable {

    public orbitElemId: number = null;
    private noise: Noise;

    // constructor(worldData: WorldData, data_: any) {
    //     super(worldData);
    // }


    constructor(worldData: WorldData) {
        super(worldData);
    }


    ptsGeo: pointGeoArr;
    ptsCart: Float32Array;
    ptsColor: Float32Array;

    ptsLines: Float32Array;



    public init() {
        this.noise = new (noise_lib as any).Noise(Math.random()); // todo make a NoiseWrapper

        var color: THREE.Color = new THREE.Color();


        var sphSize = 500;
        var maxElev = 50;
        var cartPts: arr3numb;

        // this.ptsGeo = Points.makeGeoPtsSquares(0);
        this.ptsGeo = Points.makeGeoPtsFibb(1000 * 10);
        // this.ptsGeo = Points.makeGeoPoissonDiscSample(1000 * 10);
        // this.ptsGeo = Points.makeGeoPtsRandOk(1000 * 50);
        // this.ptsGeo = Points.makeGeoPoissonDiscSample(100);

        // var graph = new Graph().mkUndirGeo(this.ptsGeo);


        this.ptsCart = new Float32Array(this.ptsGeo.length * 3)
        this.ptsColor = new Float32Array(this.ptsGeo.length * 3)


        for (let index = 0; index < this.ptsGeo.length; index++) {
            const stepInd = index * 3
            const ptGeo = this.ptsGeo[index];

            cartPts = Points.cartesianRadius(ptGeo, 2);
            var elev = this.noise.perlin3(...cartPts) * maxElev;
            cartPts = Points.cartesianRadius(ptGeo, sphSize + elev);

            // console.log(" -------------- ptGeo", ptGeo);

            this.ptsCart[stepInd + 0] = cartPts[0]
            this.ptsCart[stepInd + 1] = cartPts[1]
            this.ptsCart[stepInd + 2] = cartPts[2]

            // this.ptsCart[stepInd + 0] = (ptGeo[1]) * 4
            // this.ptsCart[stepInd + 1] = elev
            // this.ptsCart[stepInd + 2] = (ptGeo[0] - 180) * 4

            // color.setRGB(Math.random(), Math.random(), Math.random());

            // var vx = cartPts[0] / (sphSize + maxElev) + 0.5;
            // var vy = cartPts[1] / (sphSize + maxElev) + 0.5;
            // var vz = cartPts[2] / (sphSize + maxElev) + 0.5;
            var vx = (elev / maxElev / 2) + 0.5;
            var vy = (elev / maxElev / 2) + 0.5;
            var vz = (elev / maxElev / 2) + 0.5;
            color.setRGB(vx, vy, vz);
            if (index == 0)
                color.setRGB(1, 0, 0);

            // this.ptsColor[index] = [color.r, color.g, color.b];
            // this.ptsColor.push(color.r, color.g, color.b);

            this.ptsColor[stepInd + 0] = color.r
            this.ptsColor[stepInd + 1] = color.g
            this.ptsColor[stepInd + 2] = color.b
        }


        this.ptsLines = new d3GeoWrapper(this.ptsGeo).getVoroLineSegsCart(this.ptsCart);


        // console.log("this.ptsGeo", this.ptsGeo);
        // console.log("this.ptsCart", this.ptsCart);
        // console.log("this.ptsColor", this.ptsColor);


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

}