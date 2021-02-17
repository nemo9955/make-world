
import { WorldData } from "./WorldData"
import { WorldGui } from "./WorldGui"
import { DataBaseManager, Identifiable } from "./DataBaseManager"
import * as Units from "../utils/Units"
import GenericWorkerInstance from "worker-loader!./Generic.worker.ts";
import { Config, MessageType, WorkerData, WorkerState } from "./Config"
import * as THREE from "three";
import { Ticker, waitBlocking } from "../utils/Time";
import { SharedData } from "./SharedData";
import { EventsManager } from "./EventsManager";
import { OrbitingElement } from "../generate/OrbitingElement";
import { DrawWorker } from "./DrawWorker";




export class MainManager {
    cam_timeout: any = null;

    draw_worker: GenericWorkerInstance;
    update_worker: GenericWorkerInstance;
    gui: WorldGui;

    workers: GenericWorkerInstance[] = [];
    workersData = new Map<GenericWorkerInstance, WorkerData>()

    world: WorldData;
    config: Config;

    ticker: Ticker;

    sharedData = new SharedData();
    evmng: EventsManager;

    viewableThings: HTMLElement[] = [];

    constructor() {
        this.world = new WorldData("MainManager");
        this.gui = new WorldGui();
        this.config = new Config();
        this.evmng = new EventsManager();

        // TODO Actions will need to tell everyone of cases when a readDeep will be need
        // Usual var updates will be ok readShallow, structure changes need readDeep
        this.ticker = new Ticker(false, this.loopCheck.bind(this), Units.LOOP_INTERVAL, Units.LOOP_INTERVAL * 1.9)
    }

    public async init() {
        this.sharedData.initMain();
        this.spread_objects();
        // console.log("window.isSecureContext", window.isSecureContext);
        // TODO make dedicated post to UPDATE/set the sharedData to workers

        this.world.init().then(() => {
            this.config.WorldPlanetarySystemID = this.world.planetary_system.id;
            this.gui.init();
        }).then(() => {
            return this.writeDeep();
        }).then(() => {
            this.init_update_worker();
            this.init_draw_worker();
            // this.config.globalIsReady = true;
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
            if (object_.sharedData === null) object_.sharedData = this.sharedData;
            if (object_.manager === null) object_.manager = this;
            if (object_.config === null) object_.config = this.config;
            if (object_.world === null) object_.world = this.world;
        }
    }


    public async refreshConfig() {
        this.ticker.updateState(this.config.do_main_loop && this.config.globalIsReady)

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
        console.debug(`#HERELINE MainManager pauseAll `);
        // this.config.globalIsReady = false;
        // this.gui.selectOrbElement(null);
        this.ticker.stop();
        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            this.workersData.get(worker_).state = WorkerState.Paused;
            console.debug("MainManager pauseAll postMessage ", worker_.name);
            worker_.postMessage({
                message: MessageType.Pause,
                config: this.config
            });
        }
    }

    public playAll(refreshType: MessageType) {
        console.debug(`#HERELINE MainManager playAll `);
        this.config.globalIsReady = true;
        // this.gui.selectOrbElement(null);
        this.ticker.updateState(this.config.do_main_loop && this.config.globalIsReady)
        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            this.workersData.get(worker_).state = WorkerState.Running;
            console.debug("MainManager playAll postMessage ", worker_.name);
            worker_.postMessage({
                message: refreshType,
                config: this.config
            });
        }
    }


    public loopCheck() {
        // if ((this.lastHover?.id === undefined && this.sharedData.hoverId !== null)
        //     || this.lastHover?.id != this.sharedData.hoverId) {

        //     this.lastHover = this.world.stdBObjMap.get(this.sharedData.hoverId)
        //     // console.log("this.lastHover?.id", this.lastHover?.id);
        //     // console.log("this.sharedData.hoverId", this.sharedData.hoverId);

        // }
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

        // if (this.workers.every(work_ => this.workersData.get(work_).state >= WorkerState.Ready))
        this.playAll(MessageType.RefreshDBDeep);
        // for (const worker_ of this.workers) {
        //     // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
        //     console.log("MainManager writeDeep postMessage ", worker_.name);
        //     worker_.postMessage({
        //         message: MessageType.RefreshDBDeep,
        //         config: this.config
        //     });
        // }
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
        this.workersData.set(this.draw_worker, { state: WorkerState.Paused })
        this.draw_worker.postMessage({ create: "DrawWorker", sab: this.sharedData.sab });

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
        this.workersData.set(this.update_worker, { state: WorkerState.Paused })
        this.update_worker.postMessage({ create: "UpdateWorker", sab: this.sharedData.sab });

        this.update_worker.addEventListener("message", (event) => {
            this.get_message(this.update_worker, event)
        });

        this.update_worker.postMessage({
            message: MessageType.InitWorker,
            config: this.config
        });
    }


    private resumeWorkers(the_worker: GenericWorkerInstance) {
        var workerData_ = this.workersData.get(the_worker)
        workerData_.state = WorkerState.Ready

        console.log("this.workersData", this.workersData);
        if (this.workers.every(work_ => this.workersData.get(work_).state >= WorkerState.Ready)) {
            this.playAll(MessageType.RefreshDBDeep);
        }

        // the_worker.postMessage({
        //     message: MessageType.RefreshDBDeep,
        //     config: this.config
        // });
    }

    public get_message(the_worker: GenericWorkerInstance, event: MessageEvent) {
        // console.debug("#HERELINE MainManager get_message ", event.data.message, the_worker.name);

        switch (event.data.message as MessageType) {
            case MessageType.Ready:
                this.resumeWorkers(the_worker); break;
            case MessageType.RefreshConfig:
                this.refreshConfig(); break;
            case MessageType.RefreshDBShallow:
                this.readShallow(); break;
            case MessageType.RefreshDBDeep:
                this.readDeep(); break;
            case MessageType.MakeCanvas:
                DrawWorker.initDrawWorkerCanvas(this, the_worker, event);
                this.gui.regenerate(false);
                break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }



}