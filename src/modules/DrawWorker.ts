
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as Units from "../utils/Units"

// import { SWorldManager, SWorldConfig } from "../manage/SWorldManager"

import { DataBaseManager } from "./DataBaseManager"
import { WorldData } from "./WorldData"
import { DrawWorld } from "./DrawWorld"

import { Config } from "./Config"

export class DrawWorker {
    draw_world: DrawWorld

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

        this.draw_world = new DrawWorld();
        this.draw_world.world = this.world
        this.draw_world.config = this.config
        this.draw_world.manager = this

        this.dbm.open()
            .then((value) => this.world.init_worker())
            .then((value) => this.draw_world.init())
    }

    public get_message(worker: Worker, event: MessageEvent) {
        if (event?.data?.config && this.config) {
            this.config.clone(event.data.config as Config)
        }

        switch (event.data.message) {
            case 'init':
                this.init()
                this.draw_world.canvasOffscreen = event.data.canvas
                break;
            case 'update':
                this.update_message(event)
                break;
        }
    }

    public update_message(event?: MessageEvent) {
        if (this.dbm.idb)
            this.world.read()

        this.draw_world.canvasOffscreen.height = this.config.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS
        this.draw_world.canvasOffscreen.width = this.config.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS

        if (this.config.update_draw) // TODO update_draw also a flag to hold draw until init done
            this.draw_world.update();

        if (this.config.update_draw && this.is_drawing == false) this.draw();
        else this.is_drawing = this.config.update_draw;
    }

    private draw() {
        if (this.config.update_draw) {
            this.is_drawing = this.config.update_draw;
            setTimeout(() => { this.draw() }, 500);
        }

        this.draw_world.draw();

    }



}