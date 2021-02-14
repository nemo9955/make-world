
import { WorldData } from "./WorldData"
import { DrawWorker } from "./DrawWorker"

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



export class DrawD3Stats {
    sharedData: SharedData = null;
    world: WorldData = null;
    canvasOffscreen: OffscreenCanvas = null;
    config: Config = null;
    fakeDOM = new WorkerDOM();


    constructor() {

    }


    public init() {
        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_); })
        this.resize(this.canvasOffscreen); // lazy use canvas since params same as Event ...
    }


    public resize(event_: any) {
        // console.debug("#HERELINE DrawD3Stats resize", event_);
        this.canvasOffscreen.width = event_.width
        this.canvasOffscreen.height = event_.height
        this.fakeDOM.clientWidth = event_.width
        this.fakeDOM.clientHeight = event_.height
    }




    public draw() {
        var barw = 50;
        var barh = 50;
        var width = this.canvasOffscreen.width;
        var height = this.canvasOffscreen.height;

        // a reference to our canvas' context, a "toolbox"
        var context = this.canvasOffscreen.getContext("2d");


        // make some data
        var data = d3.range(1000).map(d => d);
        //     var data = [5, 40, 90, 500];

        // create our x scale
        var x = d3.scaleLinear()
            .range([10, width - 10])
            .domain(d3.extent(data));

        // create our color scale
        var colorScale = d3.scaleSequential(d3.interpolateSpectral)
            .domain(d3.extent(data));

        // loop over our data and draw on the canvas
        data.forEach((d, i) => {
            context.fillStyle = colorScale(d);
            context.fillRect(x(d), 150, 50, 50);
        });

    }


}