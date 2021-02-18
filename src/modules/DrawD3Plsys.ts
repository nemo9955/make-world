
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


/*

https://observablehq.com/@d3/indented-tree?collection=@d3/d3-hierarchy
https://observablehq.com/@pstuffa/canvas-treemap

*/

// TODO consider this as way to vizualize scale :
// https://en.wikipedia.org/wiki/File:Lagrange_points_of_planets_relative_to_sun.svg


export class DrawD3Plsys implements DrawWorkerInstance {
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
        this.ctx = this.canvasOffscreen.getContext("2d");
        this.drawOnce();
    }


    public updateDeep() {
        console.debug(`#HERELINE ${this.type} updateDeep `);
        this.drawOnce();
        // this.drawOnce();
        // this.drawOnce();

    }

    public draw() {
        // this.drawOnce();
    }

    public drawOnce() {
        // this.ctx = this.canvasOffscreen.getContext("2d");
        var context = this.ctx;
        // console.log("this.canvasOffscreen", this.canvasOffscreen);
        context.clearRect(0, 0, this.canvasOffscreen.width, this.canvasOffscreen.height);

        // https://github.com/d3/d3-hierarchy#stratify
        // var plsysRoot = d3.stratify<OrbitingElement>()
        //     .id((d) => d.id?.toString())
        //     .parentId((d) => d.parentId?.toString())
        //     (this.world.planetary_system.getAllElems());
        // console.log("plsysRoot", plsysRoot);

        // TMP
        // const root = plsysRoot;

        // const nodes = root.descendants();
        // const nodes = root.leaves();

        var nodeSize = 17;

        const allElems = this.world.planetary_system.getAllElems()
        // nodes.forEach((node, index) => {
        allElems.forEach((node, index) => {
            // context.save(); // For clipping the text
            // context.globalAlpha = 0.7;
            // context.beginPath();
            var nx = nodeSize * 2 * node.depth + 50;
            var ny = nodeSize * 1.5 * index + 50;

            context.fillStyle = "black";
            var color: Color = (node as any)?.color;
            if (color) context.fillStyle = color.getRgb().formatRgb();

            context.fillRect(
                nx, // x
                ny, // y
                nodeSize, // width
                nodeSize // height
            )
            // context.fillStyle = getColor(leaf)

            context.font = "10px Arial";
            context.fillStyle = "black";
            const textData = `${node.type} ${node.id}` //.split(/(?=[A-Z][^A-Z])/g).concat(format(leaf.value));
            context.fillText(textData, nx + 30, ny + 10)

            // context.fill();

            // context.clip(); // Generate the Clip Path
            // context.globalAlpha = 1;
            // textData.forEach((d, i, nodes) => {

            //     let offsetY = 12; // Some simple logic to set the y of the text
            //     if (i > 0) {
            //         offsetY += i * 12
            //     }

            //     context.fillStyle = "black";
            //     context.fillText(d, 30, (nodeSize * index) + offsetY)
            // });

            // context.restore();  // Restore so you can continue drawing
        });


        var resizeObj = {
            width: this.canvasOffscreen.width,
            height: Math.round(allElems.length * nodeSize * 1.5) + 100,
        }
        if (resizeObj.height != this.canvasOffscreen.height) {
            this.resize(resizeObj);
            this.drawOnce();
        }
    }

}