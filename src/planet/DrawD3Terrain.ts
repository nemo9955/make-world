
import { WorldData } from "../modules/WorldData"
import * as d3 from "d3"

import { Config, WorkerEvent } from "../modules/Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import * as Points from "../utils/Points"


import { ObjectPool } from "../utils/ObjectPool";
import { Orbit } from "../orbiting_elements/Orbit";
import { Planet } from "../orbiting_elements/Planet";
import { Star } from "../orbiting_elements/Star";
import { WorkerDOM } from "../utils/WorkerDOM";
import { OrbitingElement } from "../orbiting_elements/OrbitingElement";
import { SpaceGroup } from "../orbiting_elements/SpaceGroup";
import { PlanetarySystem } from "../orbiting_elements/PlanetarySystem";
import { Color, colorArray } from "../utils/Color"


import { pointGeoArr } from "../utils/Points"
import { DrawWorkerInstance } from "../modules/GenWorkerMetadata"
import { Terrain } from "./Terrain"


import { JguiMake, JguiManager } from "../gui/JguiMake"
import { jguiData } from "../gui/JguiUtils"


/*
https://github.com/Fil/d3-geo-voronoi

https://bl.ocks.org/d3indepth/c62b6ce6625b69f6007cea5fccdd4599
https://observablehq.com/@d3/u-s-map-canvas

!!!!!!!!! https://observablehq.com/@d3/zoom-canvas-rescaled?collection=@d3/d3-zoom


https://bl.ocks.org/pkerpedjiev/32b11b37be444082762443c4030d145d D3 event filtering
The red circles don't allow scroll-wheel zooming and drag-based panning
https://bl.ocks.org/mbostock/6675193



*/


export class DrawD3Terrain implements DrawWorkerInstance {
    public readonly type = this.constructor.name;
    public world: WorldData = null;
    public canvasOffscreen: OffscreenCanvas = null;
    public config: Config = null;
    public fakeDOM = new WorkerDOM();

    private ctx: OffscreenCanvasRenderingContext2D = null;
    // private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D = null;
    public terrain: Terrain = null;

    ptsRadius: number = 4;

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
    // points: { coordinates: pointGeoArr; type: string }



    constructor() {
    }


    public initWorker(event: WorkerEvent) {
        console.debug(`#HERELINE ${this.type} init `);
        this.canvasOffscreen = event.data.canvas;
        this.ctx = this.canvasOffscreen.getContext("2d");

        this.fakeDOM.addEventListener("resize", (event_) => { this.resize(event_); })
        this.initBase();
        this.resize(this.canvasOffscreen); // lazy use canvas since params same as Event ...
    }


    public resize(event_: any) {
        console.debug("#HERELINE ${this.type} resize", event_);
        this.canvasOffscreen.width = event_.width
        this.canvasOffscreen.height = event_.height
        this.fakeDOM.clientWidth = event_.width
        this.fakeDOM.clientHeight = event_.height
        this.translation = [this.canvasOffscreen.width / 2, this.canvasOffscreen.height / 2];
        this.projection.translate(this.translation)
        // this.ctx = this.canvasOffscreen.getContext("2d");

        // this.initBase();
        // this.setTmpFastDraw();
        this.drawOnce();
    }


    public updateDeep() {
        console.debug(`#HERELINE ${this.type} updateDeep `);
        // this.initBase();
        // this.setTmpFastDraw();
        this.drawOnce();
    }

    public updateShallow() {
        console.debug(`#HERELINE ${this.type} updateShallow `);
        // this.initBase();
        // this.setTmpFastDraw();
        this.drawOnce();
    }

    public draw() {
        // this.drawOnce();
    }


    public updateProjection(prStr: string) {
        console.log(`#HERELINE DrawD3Terrain updateProjection `, prStr);

        var viewMap = DrawD3Terrain.getGeoViewsMap();
        var newPro = viewMap.get(prStr)()
            .translate(this.translation)
            .rotate(this.projection.rotate())

        this.projection = newPro;
        this.path.projection(this.projection)

        this.originalScale = this.projection.scale()
        this.scale = this.originalScale;

        this.drawOnce();
    }

    public initBase() {
        console.debug(`#HERELINE ${this.type} initBase `);
        this.graticule = d3.geoGraticule();
        this.translation = [this.canvasOffscreen.width / 2, this.canvasOffscreen.height / 2];

        var viewMap = DrawD3Terrain.getGeoViewsMap();
        this.projection = viewMap.get(DrawD3Terrain.defaultGeoViews())()
            .translate(this.translation)

        this.originalScale = this.projection.scale()
        this.scale = this.originalScale;

        this.path = d3.geoPath()
            .projection(this.projection)
            .context(this.ctx)
            .pointRadius(this.ptsRadius);

        this.grid = this.graticule();

        this.zoom = d3.zoom()
        .filter(event => {
            // console.log("event", event);
            switch (event.type) {
                // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
                case "mousedown": return event.button === 2
                case "wheel": return event.button === 0
                default: return false
            }
        })
            .scaleExtent([0.2, 7])
            .on("zoom", this.zoomed.bind(this))

        var fakeSelect = d3.select(this.fakeDOM).selection()
        fakeSelect.call(this.zoom);

    }

    fastDrawTimeout = 0;
    public setTmpFastDraw() {
        this.fastDrawTimeout = 2;
    }

    public drawOnce() {
        if (!this.terrain.posGeo) return; // TODO make more elegant !!!!!
        if (this.fastDrawTimeout > 0) this.fastDrawTimeout--;
        // console.log("this.fastDrawTimeout", this.fastDrawTimeout);

        this.ctx.clearRect(0, 0, this.canvasOffscreen.width, this.canvasOffscreen.height);

        this.ctx.save();


        this.ctx.beginPath();
        this.path(this.grid);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#ddd';
        this.ctx.stroke();

        // if (this.fastDrawTimeout == 0) {
        //     for (let index = 0; index < this.polys.features.length; index++) {
        //         const poly = this.polys.features[index];

        //         this.ctx.beginPath();
        //         this.path(poly);
        //         // this.ctx.fillStyle = "tomato"
        //         // this.ctx.fillStyle = `rgba(${153 * (50 + index) % 250}, ${79 * (49 + index) % 250}, ${555 * (17 + index) % 250}, 0.5)`;
        //         this.ctx.fillStyle = `rgba(${37 * (150 + index) % 250}, ${13 * (49 + index) % 250}, ${17 * (17 + index) % 250}, 0.4)`;
        //         this.ctx.fill();

        //     }
        // }


        // this.points = {
        //     type: "MultiPoint",
        //     // coordinates: Points.makeGeoPtsSquares(0)
        //     coordinates: Points.makeGeoPtsFibb(1000)
        //     // coordinates: Points.makeGeoPtsRandOk(1000)
        // }

        if (this.ptsRadius != 0) {
            for (let index = 0; index < this.terrain.posGeo.length; index++) {
                const element = this.terrain.posGeo[index];
                // for (const tkpl of this.terrain.tkplates) {
                this.ctx.beginPath();
                var ptsWrapper = {
                    type: "Point",
                    coordinates: element,
                }
                this.path(ptsWrapper);
                // this.ctx.fillStyle = this.terrain.colorId
                this.ctx.fillStyle = `rgb(${Math.floor(this.terrain.color[index * 3 + 0] * 255)},
                                        ${Math.floor(this.terrain.color[index * 3 + 1] * 255)},
                                        ${Math.floor(this.terrain.color[index * 3 + 2] * 255)})`
                this.ctx.fill();

            }
        }

        this.ctx.restore();
    }

    public zoomed(event: d3.D3ZoomEvent<any, any>) {
        //     // https://github.com/d3/d3-zoom#zoom_filter
        //     // https://bl.ocks.org/pkerpedjiev/32b11b37be444082762443c4030d145d
        var dx = event.sourceEvent.movementX;
        var dy = event.sourceEvent.movementY;
        const globe_pan_speed_mod = 4;

        var event_type = event.sourceEvent.type;

        if (event_type === 'wheel') {
            var scaleFactor = event.transform.k;
            var scaleChange = scaleFactor - this.previousScaleFactor;
            this.scale = this.scale + scaleChange * this.originalScale;
            this.projection.scale(this.scale);
            this.previousScaleFactor = scaleFactor;
        } else {
            var r = this.projection.rotate();
            this.rotation = [
                r[0] + dx * 0.4 * globe_pan_speed_mod,
                r[1] - dy * 0.5 * globe_pan_speed_mod,
                r[2]];
            this.projection.rotate(this.rotation);
        }
        // TODO make an drawFast variant in the future for this situation !!!!!
        // this.setTmpFastDraw();
        this.drawOnce(); // activate for smoother panning/zooming
    }




    public static defaultGeoViews() { return "geoNaturalEarth1"; }
    // public static defaultGeoViews() { return "geoMercator"; }

    public static getGeoViewsMap() {
        var ret_ = new Map();
        ret_.set("geoOrthographic", () => d3.geoOrthographic().clipAngle(90).scale(350))
        ret_.set("geoMercator", () => d3.geoMercator().scale(130))
        ret_.set("geoEquirectangular", () => d3.geoEquirectangular().scale(160))
        ret_.set("geoNaturalEarth1", () => d3.geoNaturalEarth1().scale(200))
        return ret_
    }

    // public static guiMainStatic(pane_: Tweakpane, gui: WorldGui) {
    //     var map_ = {};
    //     [...DrawD3Terrain.getGeoViewsMap().keys()].forEach(obj_ => map_[obj_] = obj_)

    //     pane_.addInput(gui.manager.config, 'terrain_geo_view', { options: map_ })
    //     // .on('change', () => { gui.refreshConfig(); });
    // }

    public addJgui(jData: jguiData): void {
        // TODO make me a drop down list

        var d3DrawTab = jData.jGui.addColapse("D3 Draw", true)

        var allProj = [...DrawD3Terrain.getGeoViewsMap().keys()];
        var [_, prdDropList] = d3DrawTab.addDropdown("D3 Projection", allProj)
        for (const prjDdObj of prdDropList) {
            prjDdObj.addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
                this.updateProjection(event.data.event.extra.listValue);
            })
            prjDdObj.addEventListener(jData.jMng, "mouseover", (event: WorkerEvent) => {
                this.updateProjection(event.data.event.extra.listValue);
            })
        }
        d3DrawTab.addSlider("D3 Points size", 0, 15, 0.1, this.ptsRadius)
            .addEventListener(jData.jMng, "input", (event: WorkerEvent) => {
                this.ptsRadius = event.data.event.target.valueAsNumber;
                this.path.pointRadius(this.ptsRadius); this.drawOnce();
            })

    }

}
