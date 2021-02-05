
import { WorldData } from "./WorldData"
import { WorldGui } from "./WorldGui"
import { DataBaseManager } from "./DataBaseManager"
import * as Units from "../utils/Units"

import GenericWorkerInstance from "worker-loader!./Generic.worker.ts";

import { Config, MessageType } from "./Config"

import * as THREE from "three";


import { make_camera } from "./DrawWorld"
import { Ticker, waitBlocking } from "../utils/Time";
import { SharedData } from "./SharedData";
import { EventsManager } from "./EventsManager";

export class MainManager {
    cam_timeout: any = null;

    draw_worker: GenericWorkerInstance;
    update_worker: GenericWorkerInstance;
    gui: WorldGui;

    workers: GenericWorkerInstance[] = [];

    world: WorldData;
    config: Config;

    ticker: Ticker;

    shared_data = new SharedData();
    evmng: EventsManager;

    constructor() {
        this.world = new WorldData("MainManager");
        this.gui = new WorldGui();
        this.config = new Config();

        this.evmng = new EventsManager();

        // TODO Actions will need to tell everyone of cases when a readDeep will be need
        // Usual var updates will be ok readShallow, structure changes need readDeep
        this.ticker = new Ticker(false, this.readShallow.bind(this), Units.LOOP_INTERVAL, Units.LOOP_INTERVAL * 1.9)
    }

    public async init() {
        this.resize()
        this.spread_objects()
        window.addEventListener('resize', this.resize.bind(this));

        this.initSharedData()

        this.world.init().then(() => {
            this.config.WorldPlanetarySystemID = this.world.planetary_system.id;
            this.gui.init();
        }).then(() => {
            return this.writeDeep();
        }).then(() => {
            this.init_update_worker();
            this.init_draw_worker();
            this.refreshConfig()
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
        }
    }

    public initSharedData() {
        // console.log("window.isSecureContext", window.isSecureContext);
        // TODO make dedicated post to UPDATE/set the shared_data to workers
        this.shared_data.initMain();
    }

    public async refreshConfig() {
        this.ticker.updateState(this.config.do_main_loop) // TODO FIXME ENABLE TEST !!!!!!!!!!!!!!!!!

        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            console.log("MainManager writeDeep postMessage ", worker_.name);
            worker_.postMessage({
                message: MessageType.RefreshConfig,
                config: this.config
            });
        }
    }


    public pauseAll() {
        this.ticker.stop();
        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            console.log("MainManager pauseAll postMessage ", worker_.name);
            worker_.postMessage({
                message: MessageType.Pause
            });
        }
    }

    public async readDeep() {
        await this.world.readDeep();
    }

    public async readShallow() {
        await this.world.readShallow();
    }

    public async writeDeep() {
        console.time("#time MainManager writeDeep");

        await this.world.writeDeep();

        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            console.log("MainManager writeDeep postMessage ", worker_.name);
            worker_.postMessage({
                message: MessageType.RefreshDBDeep,
                config: this.config
            });
        }
        console.timeEnd("#time MainManager writeDeep");
    }

    public async writeShallow() {
        console.time("#time MainManager writeShallow");

        await this.world.writeShallow();

        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            console.log("MainManager writeShallow postMessage ", worker_.name);
            worker_.postMessage({
                message: MessageType.RefreshDBShallow,
                config: this.config
            });
        }

        console.timeEnd("#time MainManager writeShallow");
    }

    public init_draw_worker() {
        this.draw_worker = new GenericWorkerInstance();
        this.draw_worker.name = "DrawWorker"
        this.workers.push(this.draw_worker);
        this.draw_worker.postMessage({ create: "DrawWorker", sab: this.shared_data.sab });

        this.draw_worker.addEventListener("message", (event) => {
            this.get_message(this.draw_worker, event)
        });

        this.draw_worker.postMessage({
            message: MessageType.InitWorker,
            config: this.config
        });
    }

    public init_update_worker() {
        this.update_worker = new GenericWorkerInstance();
        this.update_worker.name = "UpdateWorker"
        this.workers.push(this.update_worker);
        this.update_worker.postMessage({ create: "UpdateWorker", sab: this.shared_data.sab });

        this.update_worker.addEventListener("message", (event) => {
            this.get_message(this.update_worker, event)
        });

        this.update_worker.postMessage({
            message: MessageType.InitWorker,
            config: this.config
        });
    }


    public refreshWorkers(the_worker: GenericWorkerInstance) {
        the_worker.postMessage({
            message: MessageType.RefreshDBDeep,
            config: this.config
        });
    }

    public get_message(the_worker: GenericWorkerInstance, event: MessageEvent) {
        // console.debug("#HERELINE MainManager get_message ", event.data.message, the_worker.name);

        switch (event.data.message as MessageType) {
            case MessageType.Ready:
                this.refreshWorkers(the_worker); break;
            case MessageType.RefreshConfig:
                this.refreshConfig(); break;
            case MessageType.RefreshDBShallow:
                this.readShallow(); break;
            case MessageType.RefreshDBDeep:
                this.readDeep(); break;
            case MessageType.MakeCanvas:
                this.init_worker_canvas(); break;
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