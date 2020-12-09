
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as Units from "../utils/Units"

// import { SWorldManager, SWorldConfig } from "../manage/SWorldManager"
import { SWorldConfig } from "../manage/SWorldManager"
import { SWorldDraw } from "../draw/SWorldDraw"

import { SWorldDBManager } from "../manage/SWorldDBManager"
import { SWorldData } from "../data/SWorldData"

export class SWorldWorkerInstance {
    draw: SWorldDraw;
    dbm: SWorldDBManager;
    world: SWorldData;

    private _config: SWorldConfig;
    public get config(): SWorldConfig { return this._config; }
    public set config(value: SWorldConfig) {
        this._config = value;
        this.world.config = this._config
        this.draw.config = this._config
    }

    constructor() { }

    public async init_objects() {
        this.dbm = new SWorldDBManager();
        this.draw = new SWorldDraw();
        this.world = new SWorldData();
        this.world.dbm = this.dbm
        this.draw.dbm = this.dbm
        this.dbm.open().then((value) => this.world.init_worker())
    }

    public async init(event: MessageEvent) {
        this.init_objects()
    }

    public draw_message(event: MessageEvent) {
        this.draw.draw_message(event)
    }

    public get_message(worker: Worker, event: MessageEvent) {
        if (event?.data?.config) {
            this.config = event.data.config as SWorldConfig
        }

        switch (event.data.message) {
            case 'init':
                this.init(event)
                break;
            case 'draw':
                this.draw_message(event)
                break;
            case 'set_canvasOffscreen':
                this.draw.canvasOffscreen = event.data.canvas
                break;
        }
    }



}