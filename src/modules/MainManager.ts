
import { WorldGui } from "./WorldGui"
import { WorldData } from "./WorldData"
import { DataBaseManager } from "./DataBaseManager"
import * as Units from "../utils/Units"

import GenericWorkerInstance from "worker-loader!./Generic.worker.ts";

import { Config, MessageType } from "./Config"

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"


import { make_camera } from "./DrawWorld"

export const CAM_MOVED_INTERVAL = 100

export class MainManager {
    cam_timeout: any = null;

    draw_worker: GenericWorkerInstance
    update_worker: GenericWorkerInstance
    gui: WorldGui;

    world: WorldData;
    config: Config;
    dbm: DataBaseManager;

    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;

    constructor() {
        this.dbm = new DataBaseManager();
        this.world = new WorldData();
        this.gui = new WorldGui();
        this.config = new Config();
    }

    public async init() {
        this.resize()
        this.spread_objects()
        window.addEventListener('resize', this.resize.bind(this));

        this.dbm.init().then(() => {
            this.world.init();
            this.config.WorldDataID = this.world.id
            this.gui.init();
        }).then(() => {
            this.write()
        }).then(() => {
            this.init_draw_worker()
            this.init_update_worker()
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

    public async read() {
        console.time("#time MainManager read");
        await this.world.read();
        console.timeEnd("#time MainManager read");
    }

    public async write() {
        console.time("#time MainManager write");
        await this.world.write();

        this.draw_worker.postMessage({
            message: MessageType.RefreshDB,
            config: this.config
        });

        this.update_worker.postMessage({
            message: MessageType.RefreshDB,
            config: this.config
        });
        console.timeEnd("#time MainManager write");
    }

    public init_draw_worker() {
        this.draw_worker = new GenericWorkerInstance();
        this.draw_worker.postMessage({ create: "DrawWorker" });

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
        this.update_worker.postMessage({ create: "UpdateWorker" });

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
            message: MessageType.RefreshDB,
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

        const canvas: any = document.createElement('canvas');
        canvas.id = "CursorLayer";
        // canvas.style.zIndex = "8";
        canvas.style.position = "absolute";
        canvas.style.border = "1px solid";
        canvas.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        canvas.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;
        body.appendChild(canvas);

        this.camera = make_camera(this.config.innerWidth, this.config.innerHeight);
        this.controls = new OrbitControls(this.camera, canvas);
        // this.camera.position.set(0, 20, 100);
        // this.camera_update();
        this.controls.addEventListener("change", this.camera_moved.bind(this))
        // this.controls.addEventListener("end", this.camera_print.bind(this))

        var canvasOffscreen = canvas.transferControlToOffscreen();
        canvasOffscreen.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        canvasOffscreen.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;


        this.draw_worker.postMessage({
            message: MessageType.InitCanvas,
            config: this.config,
            canvas: canvasOffscreen
        }, [canvasOffscreen]);
    }

    public camera_moved() {
        // clearTimeout(this.cam_timeout);
        // this.cam_timeout = setTimeout(() => {
        // console.log(this.camera.position);
        this.draw_worker.postMessage({
            message: MessageType.RefreshCamera,
            position: this.camera.position,
            up: this.camera.up,
            r: [
                this.camera.rotation.x,
                this.camera.rotation.y,
                this.camera.rotation.z,
            ],
            // cam_rot: this.camera.rotation,
        });

        // }, CAM_MOVED_INTERVAL);
    }


}