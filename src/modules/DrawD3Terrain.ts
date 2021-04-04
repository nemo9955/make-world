
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

!!!!!!!!! https://observablehq.com/@d3/zoom-canvas-rescaled?collection=@d3/d3-zoom


https://bl.ocks.org/pkerpedjiev/32b11b37be444082762443c4030d145d D3 event filtering
The red circles don't allow scroll-wheel zooming and drag-based panning



*/


export class DrawD3Terrain implements DrawWorkerInstance {
    public readonly type = this.constructor.name;
    public sharedData: SharedData = null;
    public world: WorldData = null;
    public canvasOffscreen: OffscreenCanvas = null;
    public config: Config = null;
    public fakeDOM = new WorkerDOM();

    private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D = null;


    originalScale: number;
    scale: number;
    translation: [number, number];
    graticule: d3.GeoGraticuleGenerator;
    projection: d3.GeoProjection;
    path: any;
    grid: any;
    zoom: d3.ZoomBehavior<Element, unknown>;
    rotation: any;
    previousScaleFactor = 1;



    constructor() {
    }


    public init(event: MessageEvent) {
        console.debug(`#HERELINE ${this.type} init `);
        this.canvasOffscreen = event.data.canvas;
        this.ctx = this.canvasOffscreen.getContext("2d");

        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_); })
        this.resize(this.canvasOffscreen); // lazy use canvas since params same as Event ...
        this.initStuff();
    }


    public resize(event_: any) {
        console.debug("#HERELINE ${this.type} resize", event_);
        this.canvasOffscreen.width = event_.width
        this.canvasOffscreen.height = event_.height
        this.fakeDOM.clientWidth = event_.width
        this.fakeDOM.clientHeight = event_.height
        // this.ctx = this.canvasOffscreen.getContext("2d");
    }


    public updateDeep() {
        console.debug(`#HERELINE ${this.type} updateDeep `);
        // this.drawOnce();
    }

    public updateShallow() {
        // this.drawOnce();
    }

    public draw() {
        this.drawOnce();
        // No real-time draw is needed
    }




    public initStuff() {
        console.debug(`#HERELINE ${this.type} initStuff `);

        this.initBase();

        // var canvas = d3.create('canvas')
        // console.log("canvas", canvas);

        console.log("this.fakeDOM", this.fakeDOM);
        var fakeSelect = d3.select(this.fakeDOM).selection()
        // var fakeSelect = d3.select(this.ctx.canvas)

        console.log("fakeSelect", fakeSelect);
        fakeSelect.call(this.zoom);
    }

    public initBase() {
        console.debug(`#HERELINE ${this.type} initBase `);
        this.originalScale = this.canvasOffscreen.height / 2.1;
        this.scale = this.originalScale;
        this.translation = [this.canvasOffscreen.width / 2, this.canvasOffscreen.height / 2];
        this.graticule = d3.geoGraticule();

        // .clipAngle(90);
        this.projection = d3.geoOrthographic()
        // this.projection = d3.geoMercator()
            // .scale(this.scale)
            .translate(this.translation)

        this.path = d3.geoPath()
            .projection(this.projection)
            .context(this.ctx)
            .pointRadius(1);

        console.log("this.path", this.path);

        this.grid = this.graticule();

        this.zoom = d3.zoom()
            .scaleExtent([0.2, 7])
            .on("zoom", this.zoomed.bind(this))
    }





    public drawOnce() {
        this.ctx.clearRect(0, 0, this.canvasOffscreen.width, this.canvasOffscreen.height);

        this.ctx.save();


        this.ctx.beginPath();
        this.path(this.grid);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#ddd';
        this.ctx.stroke();

        this.ctx.restore();
    }

    public zoomed(event: d3.D3ZoomEvent<any, any>) {
        var dx = event.sourceEvent.movementX;
        var dy = event.sourceEvent.movementY;

        var event_type = event.sourceEvent.type;

        if (event_type === 'wheel') {
            var scaleFactor = event.transform.k;
            var scaleChange = scaleFactor - this.previousScaleFactor;
            this.scale = this.scale + scaleChange * this.originalScale;
            this.projection.scale(this.scale);
            this.previousScaleFactor = scaleFactor;
        } else {
            var r = this.projection.rotate();
            this.rotation = [r[0] + dx * 0.4, r[1] - dy * 0.5, r[2]];
            this.projection.rotate(this.rotation);
        }
        // TODO make an drawFast variant in the future for this situation !!!!!
        this.drawOnce(); // activate for smoother panning/zooming
    }


}






    // public initTestt() {
    //     this.canvasOffscreen = {
    //         height: 500,
    //         width: 500,
    //     } as OffscreenCanvas
    //     var canvas = d3.select('body').append('canvas')
    //         .attr('width', this.canvasOffscreen.width)
    //         .attr('height', this.canvasOffscreen.height);
    //     this.ctx = canvas.node().getContext('2d');
    //     this.initBase();
    //     canvas.call(this.zoom);
    //     this.drawPeriodic();
    // }
    // public drawPeriodic() {
    //     this.drawOnce();
    //     setTimeout(() => {
    //         this.drawPeriodic()
    //     }, 500)
    // }

    // public zoomFilter(event: any): boolean {
    //     // Managed at src/modules/EventsManager.ts with
    //     // this.genericConditionalRedirect("wheel", canvas, canvas_id, worker, this.isShiftPressed.bind(this))
    //     // .filter(this.zoomFilter.bind(this))
    //     // ZOOM only works if SHIFT is held down so normal scroll can work
    //     // https://github.com/d3/d3-zoom#zoom_filter
    //     // https://bl.ocks.org/pkerpedjiev/32b11b37be444082762443c4030d145d
    //     if (event.type == "wheel" && event.shiftKey == false)
    //         return false
    //     return true
    // }