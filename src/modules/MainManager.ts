
import { WorldData } from "./WorldData"
import { WorldGui } from "./WorldGui"
import { DataBaseManager } from "./DataBaseManager"
import * as Units from "../utils/Units"

import GenericWorkerInstance from "worker-loader!./Generic.worker.ts";

import { Config, MessageType } from "./Config"

import * as THREE from "three";


import { make_camera } from "./DrawWorld"
import { Ticker } from "../utils/Time";
import { SharedData } from "./SharedData";
import { EventsManager } from "./EventsManager";

export const CAM_MOVED_INTERVAL = 100

export class MainManager {
    cam_timeout: any = null;

    draw_worker: GenericWorkerInstance
    update_worker: GenericWorkerInstance
    gui: WorldGui;

    world: WorldData;
    config: Config;
    dbm: DataBaseManager;

    update_tick: Ticker;

    shared_data = new SharedData();
    evmng: EventsManager;

    constructor() {
        this.dbm = new DataBaseManager();
        this.world = new WorldData("MainManager");
        this.gui = new WorldGui();
        this.config = new Config();

        this.evmng = new EventsManager();

        // TODO Actions will need to tell everyone of cases when an readDeep will be need
        // Usual var updates will be ok readShallow, structure changes need readDeep
        this.update_tick = new Ticker(false, this.readShallow.bind(this), 100)
    }

    public async init() {
        this.resize()
        this.spread_objects()
        window.addEventListener('resize', this.resize.bind(this));

        this.initSharedData()

        this.dbm.init().then(() => {
            this.world.init();
            this.config.WorldPlanetarySystemID = this.world.planetary_system.id;
            this.gui.init();
        }).then(() => {
            this.writeDeep();
        }).then(() => {
            this.init_draw_worker();
            this.init_update_worker();
            this.update_tick.updateState(this.config.do_main_loop);
        })

        // // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // setTimeout(() => { // DEBUGG , draw only for the first few secs
        //     this.config.do_draw_loop = false;
        //     this.gui.refresh();
        // }, 3000);

    }

    public spread_objects() {
        var to_spread: any[] = [this.world, this.gui]
        for (const object_ of to_spread) {
            if (object_.manager === null) object_.manager = this
            if (object_.config === null) object_.config = this.config
            if (object_.world === null) object_.world = this.world
            if (object_.dbm === null) object_.dbm = this.dbm
        }
    }

    public initSharedData() {
        // console.log("window.isSecureContext", window.isSecureContext);
        // TODO make dedicated post to UPDATE/set the shared_data to workers
        this.shared_data.initMain();
    }

    public async readDeep() {
        await this.world.readDeep();
    }

    public async readShallow() {
        await this.world.readShallow();
    }

    public async writeDeep() {
        // console.time("#time MainManager write");
        this.update_tick.updateState(this.config.do_main_loop)

        await this.world.write();

        this.draw_worker.postMessage({
            message: MessageType.RefreshDBDeep,
            config: this.config
        });

        this.update_worker.postMessage({
            message: MessageType.RefreshDBDeep,
            config: this.config
        });
        // console.timeEnd("#time MainManager write");
    }

    public async writeShallow() {
        // console.time("#time MainManager write");
        this.update_tick.updateState(this.config.do_main_loop)

        await this.world.write();

        this.draw_worker.postMessage({
            message: MessageType.RefreshDBShallow,
            config: this.config
        });

        this.update_worker.postMessage({
            message: MessageType.RefreshDBShallow,
            config: this.config
        });
        // console.timeEnd("#time MainManager write");
    }

    public init_draw_worker() {
        this.draw_worker = new GenericWorkerInstance();
        this.draw_worker.postMessage({ create: "DrawWorker", sab: this.shared_data.sab });

        this.draw_worker.addEventListener("message", async (event) => {
            this.get_message(this.draw_worker, event)
        });

        this.draw_worker.postMessage({
            message: MessageType.InitWorker,
            config: this.config
        });
    }

    public init_update_worker() {
        this.update_worker = new GenericWorkerInstance();
        this.update_worker.postMessage({ create: "UpdateWorker", sab: this.shared_data.sab });

        this.update_worker.addEventListener("message", async (event) => {
            this.get_message(this.update_worker, event)
        });

        this.update_worker.postMessage({
            message: MessageType.InitWorker,
            config: this.config
        });
    }


    public refresh_workers(the_worker: GenericWorkerInstance) {
        the_worker.postMessage({
            message: MessageType.RefreshDBDeep,
            config: this.config
        });
    }

    public get_message(the_worker: Worker, event: MessageEvent) {
        console.debug("#HERELINE MainManager get_message ", event.data.message);

        switch (event.data.message as MessageType) {
            case MessageType.Ready:
                this.refresh_workers(the_worker)
                break;
            case MessageType.MakeCanvas:
                this.init_worker_canvas()
                break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }


    public resize() {
        this.config.innerWidth = window.innerWidth;
        this.config.innerHeight = window.innerHeight;

        if (this.draw_worker)
            this.draw_worker.postMessage({
                message: MessageType.Resize,
                config: this.config
            });
    }

    public init_worker_canvas() {
        this.config.innerWidth = window.innerWidth;
        this.config.innerHeight = window.innerHeight;

        var body = document.getElementsByTagName("body")[0];

        body.style.margin = "0"

        const canvas = document.createElement('canvas');
        canvas.id = "CursorLayer";
        // canvas.style.zIndex = "8";
        canvas.style.position = "absolute";
        canvas.tabIndex = 0; // so canvas can get keydown events
        canvas.style.border = "1px solid";
        canvas.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        canvas.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;
        body.appendChild(canvas);


        // console.log("canvas", canvas);
        // "mousedown" "mouseenter" "mouseleave" "mousemove" "mouseout" "mouseover" "mouseup":
        canvas.addEventListener('mousemove', (evt) => {
            var rect = canvas.getBoundingClientRect();
            this.shared_data.mousex = evt.clientX - rect.left;
            this.shared_data.mousey = evt.clientY - rect.top;
        }, false);
        canvas.addEventListener('mouseleave', () => {
            this.shared_data.mousex = null;
            this.shared_data.mousey = null;
        }, false);


        // TODO have a more dynamic ID-based way of propagating events
        this.evmng.addOrbitCtrlEvents(canvas, canvas.id, this.draw_worker)


        var canvasOffscreen = canvas.transferControlToOffscreen();
        canvasOffscreen.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        canvasOffscreen.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;

        this.draw_worker.postMessage({
            message: MessageType.InitCanvas,
            config: this.config,
            canvas: canvasOffscreen,
            canvas_id: canvas.id,
        }, [canvasOffscreen]);
    }



}