
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import SWorldDrawWorker from "worker-loader!./SWorld.worker";
// import SWorldDrawWorker from "worker-loader!../../../workers/SWorldDraw.worker";

import * as Units from "../utils/Units"
import { SWorldManage, SWorldConfig } from "../manage/SWorldManage"


export class SWorldWorkerManager {

    worker_draw: any
    canvas: any
    canvasOffscreen: HTMLCanvasElement
    config: SWorldConfig

    private _manager: SWorldManage;
    public get manager(): SWorldManage { return this._manager; }
    public set manager(value: SWorldManage) {
        this._manager = value;
        this.config = this._manager.config;
    }

    constructor() { }


    public init_draw_worker() {
        this.add_canvas()
        window.addEventListener('resize', this.resize.bind(this));
        this.worker_draw = new SWorldDrawWorker();

        this.worker_draw.postMessage({
            message: 'init'
        });
        this.init_draw()
    }


    public init_draw() {
        this.worker_draw.postMessage({
            message: 'set_canvasOffscreen',
            config: this.config,
            canvas: this.canvasOffscreen
        }, [this.canvasOffscreen]);
        this.draw_update()
    }


    public draw_update() {
        this.worker_draw.postMessage({
            message: 'draw',
            config: this.config
        });
    }

    public init() {
        this.init_draw_worker()
    }

    public resize() {
        // console.log("this.canvas", this.canvas);
        // console.log("this.canvasOffscreen", this.canvasOffscreen);
        this.canvasOffscreen.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        this.canvasOffscreen.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;
    }


    public add_canvas() {
        var body = document.getElementsByTagName("body")[0];

        body.style.margin = "0"

        this.canvas = document.createElement('canvas');

        this.canvas.id = "CursorLayer";
        // this.canvas.style.zIndex = "8";
        this.canvas.style.position = "absolute";
        this.canvas.style.border = "1px solid";
        body.appendChild(this.canvas);

        this.canvas.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        this.canvas.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;

        this.canvasOffscreen = this.canvas.transferControlToOffscreen();

        this.resize()
    }

}