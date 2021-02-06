
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as Units from "../utils/Units"

import { DataBaseManager } from "./DataBaseManager"
import { WorldData } from "./WorldData"
import { DrawWorld } from "./DrawWorld"

import { Config, MessageType } from "./Config"
import { Intervaler, Ticker } from "../utils/Time"
import { SharedData } from "./SharedData";
import { WorkerDOM } from "../utils/WorkerDOM";


export class DrawWorker {
    shared_data = new SharedData();
    draw_world: DrawWorld
    db_read_itv = new Intervaler();

    world: WorldData;
    config: Config;

    worker: Worker;

    ticker: Ticker

    constructor(worker: Worker) {
        this.worker = worker;

        this.world = new WorldData("DrawWorker");
        this.config = new Config();
        this.draw_world = new DrawWorld();
        this.ticker = new Ticker(false, this.refreshShallow.bind(this), Units.LOOP_INTERVAL, Units.LOOP_INTERVAL * 0.6)
    }

    public init() {
        this.spread_objects()
        this.world.initWorker().then(() => {
            this.worker.postMessage({ message: MessageType.MakeCanvas });
        })
    }


    public spread_objects() {
        // TODO make generic function ???
        this.world.planetary_system.id = this.config.WorldPlanetarySystemID

        var to_spread: any[] = [this.world, this.draw_world]
        for (const object_ of to_spread) {
            if (object_.config === null) object_.shared_data = this.shared_data
            if (object_.config === null) object_.config = this.config
            if (object_.world === null) object_.world = this.world
        }
    }


    public get_message(event: MessageEvent) {
        // console.debug("#HERELINE DrawWorker get_message ", event.data.message);
        if (event?.data?.config && this.config)
            this.config.copy(event.data.config as Config)

        const message_ = (event.data.message as MessageType);
        switch (message_) {
            case MessageType.InitWorker:
                this.init(); break;
            case MessageType.Pause:
                this.pause(); break;
            case MessageType.InitCanvas:
                this.init_canvas(event); break;
            case MessageType.Resize:
                this.resize(event); break;
            case MessageType.RefreshDBDeep:
            case MessageType.RefreshDBShallow:
                this.refreshDb(event, message_); break;
            case MessageType.RefreshConfig:
                this.refreshConfig(); break;
            case MessageType.Event:
                this.callEvent(event.data.event, event.data.event_id); break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }


    callEvent(event: any, event_id: any) {
        // console.log("event_id, event", event_id, event);
        this.draw_world.fakeDOM.dispatchEvent(event)
    }

    public init_canvas(event?: MessageEvent) {
        console.debug("#HERELINE DrawWorker init_canvas ");
        this.draw_world.canvasOffscreen = event.data.canvas;
        this.draw_world.init()
        this.worker.postMessage({ message: MessageType.Ready, from: "DrawWorker" });
        this.resize();
    }

    // public refresh_camera(event?: MessageEvent) {
    //     // console.log("event.data.cam_pos", event.data.cam_pos);
    //     this.draw_world.camera.position.copy(event.data.position)
    //     this.draw_world.camera.up.copy(event.data.up)
    //     this.draw_world.camera.rotation.set(event.data.r[0], event.data.r[1], event.data.r[2])
    //     this.draw_world.camera.updateProjectionMatrix()
    //     // console.log("this.draw_world.camera.position", this.draw_world.camera.position);
    // }

    public resize(event?: MessageEvent) {
        console.debug("#HERELINE DrawWorker resize ");

        this.draw_world.camera.aspect = this.config.innerWidth / this.config.innerHeight;
        this.draw_world.camera.updateProjectionMatrix();
        this.draw_world.renderer.setSize(
            this.config.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS,
            this.config.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS, false)

        // TODO levereage WorkerDOM in order to more easilly manage resize events
        this.draw_world.fakeDOM.clientWidth = this.config.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS
        this.draw_world.fakeDOM.clientHeight = this.config.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS
    }


    public async pause() {
        this.ticker.stop();
    }

    public async refreshConfig() {
        this.ticker.updateState(this.config.do_draw_loop)
    }

    public async refreshDb(event: MessageEvent, refreshType: MessageType) {
        console.debug("#HERELINE DrawWorker refresh_db ready", refreshType);
        console.time("#time DrawWorker refresh_db " + refreshType);

        await this.refreshConfig();
        var doSpecial = false;

        var prom: Promise<void> = null
        if (refreshType == MessageType.RefreshDBDeep)
            prom = this.refreshDeep(doSpecial)
        if (refreshType == MessageType.RefreshDBShallow)
            prom = this.refreshShallow(doSpecial)

        await prom.finally(() => {
            console.timeEnd("#time DrawWorker refresh_db " + refreshType);
        })
    }

    private async refreshDeep(doSpecial = true) {
        console.debug("#HERELINE DrawWorker refreshDeep");
        await this.world.readDeep();
        this.draw_world.updateDeep();
        if (doSpecial)
            this.draw_world.draw();
    }

    private async refreshShallow(doSpecial = true) {
        // console.debug("#HERELINE DrawWorker refreshShallow");
        await this.world.readShallow();
        if (doSpecial)
            this.draw_world.draw();
    }


}