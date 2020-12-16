
import { WorldGui } from "./WorldGui"
import { WorldData } from "./WorldData"
import { DataBaseManager } from "./DataBaseManager"
import * as Units from "../utils/Units"

import WorkerInstance from "worker-loader!./DrawWorker.worker.ts";

import { Config } from "./Config"

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"


import { make_camera } from "./DrawWorld"

export const CAM_MOVED_INTERVAL = 100

export class MainManager {
    cam_timeout: any = null;

    draw_worker: WorkerInstance
    gui: WorldGui;

    world: WorldData;
    config: Config;
    dbm: DataBaseManager;

    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;

    constructor() { }

    public async init_main() {
        this.dbm = new DataBaseManager();
        this.world = new WorldData();
        this.gui = new WorldGui();
        this.config = new Config();

        this.world.config = this.config
        this.world.dbm = this.dbm
        this.gui.manager = this

        await this.dbm.init()

        this.world.init();
        this.init_draw_worker()
        this.gui.init();

        this.write();

        setTimeout(() => { // start draw after init
            this.config.update_draw = true;
            this.gui.refresh();
        }, 500); // TODO find a more exact callback



        // // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // setTimeout(() => { // DEBUGG , draw only for the first few secs
        //     this.config.update_draw = false;
        //     this.gui.refresh();
        // }, 3000);



    }

    public read() {
        this.world.read();
    }

    public write() {
        this.world.write();
        this.config_update()
    }

    public init_draw_worker() {
        window.addEventListener('resize', this.resize.bind(this));
        this.draw_worker = new WorkerInstance();

        this.init_worker_canvas()
    }

    public config_update() {
        if (this.draw_worker)
            this.draw_worker.postMessage({
                message: 'update',
                config: this.config
            });
    }

    public resize() {
        this.config.innerWidth = window.innerWidth;
        this.config.innerHeight = window.innerHeight;

        this.config_update()
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
        console.log("this.controls", this.controls);
        this.controls.addEventListener("change", this.camera_moved.bind(this))
        // this.controls.addEventListener("end", this.camera_print.bind(this))

        var canvasOffscreen = canvas.transferControlToOffscreen();
        canvasOffscreen.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        canvasOffscreen.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;


        (this.draw_worker as any).postMessage({
            message: 'init',
            config: this.config,
            canvas: canvasOffscreen
        }, [canvasOffscreen]);

        this.resize()
    }

    public camera_update() {
        setTimeout(() => { this.camera_update(); }, 500);
        this.camera_moved()
    }



    public camera_moved() {
        // clearTimeout(this.cam_timeout);
        // this.cam_timeout = setTimeout(() => {
        // console.log(this.camera.position);
        this.draw_worker.postMessage({
            message: 'camera',
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