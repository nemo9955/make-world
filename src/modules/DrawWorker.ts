
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as Units from "../utils/Units"

// import { SWorldManager, SWorldConfig } from "../manage/SWorldManager"

import { DataBaseManager } from "./DataBaseManager"
import { WorldData } from "./WorldData"

import { Config } from "./Config"

export class DrawWorker {
    canvasOffscreen: HTMLCanvasElement

    world: WorldData;
    config: Config;
    dbm: DataBaseManager;

    is_drawing = false;

    constructor() { }

    public init() {
        this.dbm = new DataBaseManager();
        this.world = new WorldData();
        this.config = new Config();

        this.world.dbm = this.dbm
        this.world.config = this.config
        this.dbm.open()
            .then((value) => this.world.init_worker())
    }

    public get_message(worker: Worker, event: MessageEvent) {
        if (event?.data?.config && this.config) {
            this.config.clone(event.data.config as Config)
        }

        switch (event.data.message) {
            case 'init':
                this.canvasOffscreen = event.data.canvas
                this.init()
                break;
            case 'update':
                this.update_message(event)
                break;
        }
    }

    public update_message(event?: MessageEvent) {
        if (this.dbm.idb)
            this.world.read()
        this.canvasOffscreen.height = this.config.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS
        this.canvasOffscreen.width = this.config.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS


        if (this.config.update_draw && this.is_drawing == false) {
            this.draw()
        } else {
            this.is_drawing = this.config.update_draw;
        }
    }

    private draw() {
        if (this.config.update_draw) {
            this.is_drawing = this.config.update_draw;
            setTimeout(() => { this.draw() }, 500);
        }

        var canvas_ctx = this.canvasOffscreen.getContext("2d");
        canvas_ctx.clearRect(0, 0, this.canvasOffscreen.width, this.canvasOffscreen.height);
        canvas_ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        canvas_ctx.fillRect(100, 100, 200, 200);
        canvas_ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
        canvas_ctx.fillRect(150, 150, 200, 200);
        // console.log("this.world.planetary_system.star.color", this.world.planetary_system.star.color);
        // console.log("this.world.planetary_system.star", this.world.planetary_system.star);
        canvas_ctx.fillStyle = this.world.planetary_system.star.color.toString();
        canvas_ctx.fillRect(50 * Math.random() + 100, 50 * Math.random(), 200, 200);
    }



}