
import { WorldData } from "./WorldData"
import { DrawWorker, DrawWorkerInstance } from "./DrawWorker"

import * as d3 from "d3"

import { Config } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"


import { ObjectPool } from "../utils/ObjectPool";
import { Orbit } from "../generate/Orbit";
import { Planet } from "../generate/Planet";
import { Star } from "../generate/Star";
import { SharedData } from "./SharedData";
import { WorkerDOM } from "../utils/WorkerDOM";
import { OrbitingElement } from "../generate/OrbitingElement";
import { SpaceGroup } from "../generate/SpaceGroup";
import { PlanetarySystem } from "../generate/PlanetarySystem";
import { Color } from "../utils/Color"

// import * as Noise from "noisejs"
// import * as Noise from "noisejs/index"
// import * as Noise from "noisejs"

import Noise = require("noisejs")


/*

https://www.npmjs.com/package/noisejs
var noise = new Noise(Math.random());
simplex2(x, y): 2D Simplex noise function
simplex3(x, y, z): 3D Simplex noise function
perlin2(x, y): 2D Perlin noise function
perlin3(x, y, z): 3D Perlin noise function
seed(val): Seed the noise functions. Only 65536 different seeds are supported. Use a float between 0 and 1 or an integer from 1 to 65536.

*/




/*
https://github.com/Fil/d3-geo-voronoi

https://bl.ocks.org/d3indepth/c62b6ce6625b69f6007cea5fccdd4599
https://observablehq.com/@d3/u-s-map-canvas

*/


export class DrawD3Terrain implements DrawWorkerInstance {
    public readonly type = this.constructor.name;
    public sharedData: SharedData = null;
    public world: WorldData = null;
    public canvasOffscreen: OffscreenCanvas = null;
    public config: Config = null;
    public fakeDOM = new WorkerDOM();

    private ctx: OffscreenCanvasRenderingContext2D = null;


    constructor() {
    }


    public init(event: MessageEvent) {
        console.debug(`#HERELINE ${this.type} init `);
        this.canvasOffscreen = event.data.canvas;
        this.ctx = this.canvasOffscreen.getContext("2d");

        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_); })
        this.resize(this.canvasOffscreen); // lazy use canvas since params same as Event ...
    }


    public resize(event_: any) {
        console.debug("#HERELINE DrawD3Stats resize", event_);
        this.canvasOffscreen.width = event_.width
        this.canvasOffscreen.height = event_.height
        this.fakeDOM.clientWidth = event_.width
        this.fakeDOM.clientHeight = event_.height
        // this.ctx = this.canvasOffscreen.getContext("2d");
        this.drawOnce();
    }


    public updateDeep() {
        console.debug(`#HERELINE ${this.type} updateDeep `);
        this.drawOnce();
    }

    public updateShallow() {
        this.drawOnce();
    }

    public draw() {
        // No real-time draw is needed
    }

    public drawOnce() {
    }

}