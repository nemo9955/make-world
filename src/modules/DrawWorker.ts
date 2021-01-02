
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as Units from "../utils/Units"

import { DataBaseManager } from "./DataBaseManager"
import { WorldData } from "./WorldData"
import { DrawWorld } from "./DrawWorld"

import { Config, MessageType } from "./Config"
import { Intervaler, Ticker } from "../utils/Time"

export const READ_DB_INTERVAL = 10

export class DrawWorker {
    draw_world: DrawWorld
    db_read_itv = new Intervaler();

    world: WorldData;
    config: Config;
    dbm: DataBaseManager;
    worker: Worker;

    draw_tick: Ticker

    ready_to_draw = false;

    constructor(worker: Worker) {
        this.worker = worker;
        this.dbm = new DataBaseManager();
        this.world = new WorldData("DrawWorker");
        this.config = new Config();
        this.draw_world = new DrawWorld();
        this.draw_tick = new Ticker(false, this.draw.bind(this), 100)
    }

    public init() {
        this.spread_objects()
        this.dbm.open().then(() => {
            this.worker.postMessage({ message: MessageType.MakeCanvas });
        })
    }


    public spread_objects() {
        this.world.id = this.config.WorldDataID

        var to_spread: any[] = [this.world, this.draw_world]
        for (const object_ of to_spread) {
            if (object_.config === null) object_.config = this.config
            if (object_.world === null) object_.world = this.world
            if (object_.dbm === null) object_.dbm = this.dbm
        }
    }


    public get_message(event: MessageEvent) {
        // console.debug("#HERELINE DrawWorker get_message ", event.data.message);
        if (event?.data?.config && this.config)
            this.config.copy(event.data.config as Config)

        switch (event.data.message as MessageType) {
            case MessageType.InitWorker:
                this.init(); break;
            case MessageType.InitCanvas:
                this.init_canvas(event); break;
            case MessageType.Resize:
                this.resize(event); break;
            case MessageType.RefreshDB:
                this.refresh_db(event); break;
            case MessageType.RefreshCamera:
                this.refresh_camera(event); break;
            case MessageType.RefreshConfig:
                this.update(); break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }

    public init_canvas(event?: MessageEvent) {
        console.debug("#HERELINE DrawWorker init_canvas ");
        this.draw_world.canvasOffscreen = event.data.canvas;
        this.draw_world.init()
        this.ready_to_draw = true;
        this.worker.postMessage({ message: MessageType.Ready, from: "DrawWorker" });
    }

    public refresh_camera(event?: MessageEvent) {
        // console.log("event.data.cam_pos", event.data.cam_pos);
        this.draw_world.camera.position.copy(event.data.position)
        this.draw_world.camera.up.copy(event.data.up)
        this.draw_world.camera.rotation.set(event.data.r[0], event.data.r[1], event.data.r[2])
        this.draw_world.camera.updateProjectionMatrix()
    }

    public async refresh_db(event?: MessageEvent) {
        console.debug("#HERELINE DrawWorker refresh_db this.dbm.idb ready", !!this.dbm.idb);
        if (!this.dbm.idb) return;

        console.time("#time DrawWorker refresh_db");
        await this.world.read();
        this.update();
        console.timeEnd("#time DrawWorker refresh_db");
    }

    public resize(event?: MessageEvent) {
        console.debug("#HERELINE DrawWorker resize ");

        this.draw_world.camera.aspect = this.config.innerWidth / this.config.innerHeight;
        this.draw_world.camera.updateProjectionMatrix();
        this.draw_world.renderer.setSize(
            this.config.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS,
            this.config.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS, false)

    }

    private update() {
        console.debug("#HERELINE DrawWorker update ready_to_draw", this.ready_to_draw);
        if (!this.ready_to_draw) return;

        this.draw_world.update();

        this.draw_tick.updateState(this.config.do_draw_loop);
    }

    private draw() {
        // if (this.db_read_itv.check(READ_DB_INTERVAL)) {
        this.world.read();
        // }
        this.draw_world.draw();
    }

}