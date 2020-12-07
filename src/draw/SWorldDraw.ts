
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"



import { SWorldData } from "../data/SWorldData"
import { SWorldWorkerManager } from "../worker/SWorldWorkerManager"
import { SWorldManage, SWorldConfig } from "../manage/SWorldManage"


export class SWorldDraw {

    canvas: any
    canvasOffscreen: HTMLCanvasElement

    config: SWorldConfig;

    private _manager: SWorldManage;
    public get manager(): SWorldManage { return this._manager; }
    public set manager(value: SWorldManage) {
        this._manager = value;
        this.config = this._manager.config;
    }


    constructor() {

    }

    public init() {

    }


    public draw_message(event?: MessageEvent) {
        if (event?.data?.config) {
            this.config = event.data.config as SWorldConfig
        }

        if (this.config.update_draw)
            this.draw()
    }

    public draw() {
        if (this.config.update_draw)
            setTimeout(() => { this.draw() }, 500);

        var canvas_ctx = this.canvasOffscreen.getContext("2d");
        canvas_ctx.clearRect(0, 0, this.canvasOffscreen.width, this.canvasOffscreen.height);
        canvas_ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        canvas_ctx.fillRect(100, 100, 200, 200);
        canvas_ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        canvas_ctx.fillRect(150, 150, 200, 200);
        canvas_ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
        canvas_ctx.fillRect(50 * Math.random() + 100, 50 * Math.random(), 200, 200);
    }


}