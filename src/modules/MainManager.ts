
import { WorldGui } from "./WorldGui"
import { WorldData } from "./WorldData"
import { DataBaseManager } from "./DataBaseManager"
import * as Units from "../utils/Units"

import WorkerInstance from "worker-loader!./DrawWorker.worker.ts";

import { Config } from "./Config"

export class MainManager {

    draw_worker: WorkerInstance
    gui: WorldGui;

    world: WorldData;
    config: Config;
    dbm: DataBaseManager;

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
        var body = document.getElementsByTagName("body")[0];

        body.style.margin = "0"

        const canvas: any = document.createElement('canvas');

        canvas.id = "CursorLayer";
        // canvas.style.zIndex = "8";
        canvas.style.position = "absolute";
        canvas.style.border = "1px solid";
        body.appendChild(canvas);

        canvas.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        canvas.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;

        var canvasOffscreen = canvas.transferControlToOffscreen();
        canvasOffscreen.width = window.innerWidth - Units.CANVAS_SUBSTRACT_PIXELS;
        canvasOffscreen.height = window.innerHeight - Units.CANVAS_SUBSTRACT_PIXELS;

        this.config.innerWidth = window.innerWidth;
        this.config.innerHeight = window.innerHeight;


        (this.draw_worker as any).postMessage({
            message: 'init',
            config: this.config,
            canvas: canvasOffscreen
        }, [canvasOffscreen]);

        this.resize()
    }





}