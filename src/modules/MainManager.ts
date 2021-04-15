import * as CanvasUtils from "../utils/CanvasUtils"

import { WorldData } from "./WorldData"
import { WorldGui } from "./WorldGui"
import * as Units from "../utils/Units"
import GenericWorkerInstance from "worker-loader!./GenWorkerInstance.ts";
import { Config, MessageType, WorkerEvent, WorkerPacket } from "./Config"
import * as THREE from "three";
import { Ticker, waitBlocking } from "../utils/Time";
import { OrbitingElement } from "../generate/OrbitingElement";
import { TerrainWorker } from "./TerrainWorker";
import { BaseWorker } from "./GenWorkerMetadata";
import { PlanetSysWorker } from "./PlanetSysWorker";
import { JsonToGUI } from "../gui/JsonToGUI";


// TODO Make the main manager the one that calls each worker's "Ticker"
// order of execution can be easilly imposed and probably just simpler to manage


export class MainManager {
    cam_timeout: any = null;

    gui: WorldGui;
    jgui: JsonToGUI;

    workers: GenericWorkerInstance[] = [];

    world: WorldData;
    config: Config;

    ticker: Ticker;

    viewableThings: HTMLElement[] = [];

    constructor() {
        this.gui = new WorldGui();
        this.jgui = new JsonToGUI();
        this.config = new Config();
        this.world = new WorldData(this.config.WORLD_DATABASE_NAME, "MainManager");

        // TODO Actions will need to tell everyone of cases when a readDeep will be need
        // Usual var updates will be ok readShallow, structure changes need readDeep
        this.ticker = new Ticker(false, this.loopCheck.bind(this), Units.LOOP_INTERVAL, Units.LOOP_INTERVAL * 1.9)
    }

    public async init() {
        this.spread_objects();
        // console.log("window.isSecureContext", window.isSecureContext);
        // TODO make dedicated post to UPDATE/set the sharedData to workers

        Promise.resolve().then(() => {
            return this.world.preInit();
        }).then(() => {
            // return this.world.initPlSys();
        }).then(() => {
            // return this.world.initTerrain();
        }).then(() => {
            this.gui.init();
        }).then(() => {
            return this.writeDeep();
        }).then(() => {
            this.initGenericWorker(PlanetSysWorker)
            this.initGenericWorker(TerrainWorker)
            // this.refreshConfig()
        })

    }

    public spread_objects() {
        var to_spread: any[] = [this.world, this.gui]
        for (const object_ of to_spread) {
            if (object_.manager === null) object_.manager = this;
            if (object_.config === null) object_.config = this.config;
            if (object_.world === null) object_.world = this.world;
        }
    }


    public async refreshConfig() {
        this.ticker.updateState(this.config.globalIsReady)

        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            console.log("MainManager writeDeep postMessage ", worker_.name);
            worker_.postMessage(<WorkerPacket>{
                message: MessageType.RefreshConfig,
                config: this.config
            });
        }
    }


    public pauseAll() {
        console.debug(`#HERELINE MainManager pauseAll `);
        // this.config.globalIsReady = false;
        // this.gui.selectOrbElement(null);
        // this.ticker.stop();
        // for (const worker_ of this.workers) {
        //     // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
        //     // this.workersData.get(worker_).state = WorkerState.Paused;
        //     console.debug("MainManager pauseAll postMessage ", worker_.name);
        //     worker_.postMessage(<WorkerPacket>{
        //         message: MessageType.Pause,
        //         config: this.config
        //     });
        // }
    }

    public playAll(refreshType: MessageType) {
        console.debug(`#HERELINE MainManager playAll `);
        this.config.globalIsReady = true;
        // this.gui.selectOrbElement(null);
        this.ticker.updateState(this.config.globalIsReady)
        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            // this.workersData.get(worker_).state = WorkerState.Running;
            console.debug("MainManager playAll postMessage ", worker_.name);
            worker_.postMessage(<WorkerPacket>{
                message: refreshType,
                config: this.config
            });
        }
    }


    public loopCheck() {
        // if ((this.lastHover?.id === undefined && this.sharedData.hoverId !== null)
        //     || this.lastHover?.id != this.sharedData.hoverId) {

        //     this.lastHover = this.world.idObjMap.get(this.sharedData.hoverId)
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
        //     worker_.postMessage(<WorkerPacket>{
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
            worker_.postMessage(<WorkerPacket>{
                message: MessageType.RefreshDBShallow,
                config: this.config
            });
        }

        console.timeEnd("#time MainManager writeShallow");
    }

    public initGenericWorker(workerClass: typeof BaseWorker) {
        var genWorker = new GenericWorkerInstance();
        genWorker.name = workerClass.name

        this.workers.push(genWorker);
        genWorker.postMessage(<WorkerPacket>{ create: genWorker.name, config: this.config });

        genWorker.addEventListener("message", (event) => {
            this.getMessage(genWorker, event)
        });

        genWorker.postMessage(<WorkerPacket>{
            message: MessageType.InitWorker,
            config: this.config
        });
    }

    // public initWorker(workerType: string) {
    //     var worker_ = new GenericWorkerInstance();
    //     worker_.name = workerType
    //     this.workers.push(worker_);
    //     // this.workersData.set(worker_, { state: WorkerState.Paused })
    //     worker_.postMessage(<WorkerPacket>{ create: workerType, sab: this.sharedData.sab });

    //     worker_.addEventListener("message", (event) => {
    //         this.getMessage(worker_, event)
    //     });

    //     worker_.postMessage(<WorkerPacket>{
    //         message: MessageType.InitWorker,
    //         config: this.config
    //     });
    // }

    private readyWorker(the_worker: GenericWorkerInstance) {
        // var workerData_ = this.workersData.get(the_worker)
        // workerData_.state = WorkerState.Ready

        // console.log("this.workersData", this.workersData);
        // if (this.workers.every(work_ => this.workersData.get(work_).state >= WorkerState.Ready)) {
        // this.playAll(MessageType.RefreshDBDeep);
        // }

        the_worker.postMessage(<WorkerPacket>{
            message: MessageType.Play,
            config: this.config
        });
    }

    public getMessage(the_worker: GenericWorkerInstance, event: WorkerEvent) {
        // console.debug("#HERELINE MainManager getMessage ", event.data.message, the_worker.name);

        switch (event.data.message as MessageType) {
            case MessageType.Ready:
                this.readyWorker(the_worker); break;
            case MessageType.RefreshConfig:
                this.refreshConfig(); break;
            case MessageType.RefreshDBShallow:
                this.readShallow(); break;
            case MessageType.RefreshDBDeep:
                this.readDeep(); break;
            case MessageType.RefreshJGUI:
                this.jgui.refreshJgui(the_worker, event); break;
            case MessageType.CanvasMake:
                CanvasUtils.makeWorkerCanvas(this, the_worker, event);
                this.gui.regenerate(false);
                break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }



}