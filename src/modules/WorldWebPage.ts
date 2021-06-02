import * as CanvasUtils from "../utils/CanvasUtils"

import { WorldData } from "./WorldData"
import * as Units from "../utils/Units"
import GenericWorkerInstance from "worker-loader!./GenWorkerInstance.ts";
import { Config, MessageType, WorkerEvent, WorkerPacket } from "./Config"
import * as THREE from "three";
import { Ticker, waitBlocking } from "../utils/Time";
import { OrbitingElement } from "../orbiting_elements/OrbitingElement";
import { TerrainWorker } from "../planet/TerrainWorker";
import { BaseWorker } from "./GenWorkerMetadata";
import { PlanetSysWorker } from "../plant_sys/PlanetSysWorker";
import { JsonToGUI } from "../gui/JsonToGUI";


// TODO Make the main manager the one that calls each worker's "Ticker"
// order of execution can be easilly imposed and probably just simpler to manage


export class WorldWebPage {
    static get type() { return `WorldWebPage` }
    get name() { return `WorldWebPage` }

    cam_timeout: any = null;

    jgui: JsonToGUI;

    workers: GenericWorkerInstance[] = [];

    world: WorldData;
    config: Config;

    constructor() {
        this.jgui = new JsonToGUI();
        this.config = new Config();
        this.world = new WorldData(this.config.WORLD_DATABASE_NAME, this.name, 10, this.config);

        // TODO Actions will need to tell everyone of cases when a readDeep will be need
        // Usual var updates will be ok readShallow, structure changes need readDeep
        // this.ticker = new Ticker(false, this.loopCheck.bind(this), Units.LOOP_INTERVAL, Units.LOOP_INTERVAL * 1.9)
    }

    public async init() {
        this.spread_objects();
        // console.log("window.isSecureContext", window.isSecureContext);
        // TODO make dedicated post to UPDATE/set the sharedData to workers

        Promise.resolve().then(() => {
            return this.world.preInit();
        }).then(() => {
            this.initGenericWorker(PlanetSysWorker, 11)
            this.initGenericWorker(TerrainWorker, 12)
        })

    }

    public spread_objects() {
        var to_spread: any[] = [this.world]
        for (const object_ of to_spread) {
            if (object_.manager === null) object_.manager = this;
            if (object_.config === null) object_.config = this.config;
            if (object_.world === null) object_.world = this.world;
        }
    }


    public async refreshConfig() {
        // this.ticker.updateState(this.config.globalIsReady)

        for (const worker_ of this.workers) {
            // waitBlocking(50); // TODO TMP !!!!!!!!!!!!!!
            console.log(`${this.name} writeDeep postMessage `, worker_.name);
            worker_.postMessage(<WorkerPacket>{
                message: MessageType.RefreshConfig,
                config: this.config
            });
        }
    }


    public pauseAll() {
        console.debug(`#HERELINE ${this.name} pauseAll `);
    }


    public initGenericWorker(workerClass: typeof BaseWorker, startId: number) {
        var genWorker = new GenericWorkerInstance();
        genWorker.name = workerClass.name

        this.workers.push(genWorker);
        genWorker.postMessage(<WorkerPacket>{ create: genWorker.name, config: this.config, startId: startId });

        genWorker.addEventListener("message", (event) => {
            this.getMessage(genWorker, event)
        });

        genWorker.postMessage(<WorkerPacket>{
            message: MessageType.InitWorker,
            config: this.config
        });
    }

    private readyWorker(the_worker: GenericWorkerInstance) {
        the_worker.postMessage(<WorkerPacket>{
            message: MessageType.Play,
            config: this.config
        });
    }


    callEvent(the_worker: GenericWorkerInstance, woEvent: WorkerEvent) {
        if (woEvent.data?.metadata?.broadcast) {
            for (const worker of this.workers) {
                if (worker != the_worker) {
                    worker.postMessage(<WorkerPacket>woEvent.data);
                }
            }
        } else {
            console.warn("Not implemented", woEvent)
        }

        // if (woEvent.data?.metadata?.isWorldEvent) {
        //     console.warn("Not implemented", woEvent)
        // } else {
        //     console.warn("Not implemented", woEvent)
        // }
    }



    public getMessage(the_worker: GenericWorkerInstance, event: WorkerEvent) {
        // console.debug("#HERELINE MainWorldManager getMessage ", event.data.message, the_worker.name);

        switch (event.data.message as MessageType) {
            case MessageType.Ready:
                this.readyWorker(the_worker); break;
            case MessageType.RefreshConfig:
                this.refreshConfig(); break;
            // case MessageType.RefreshDBShallow:
            //     this.readShallow(); break;
            // case MessageType.RefreshDBDeep:
            //     this.readDeep(); break;
            case MessageType.RefreshJGUI:
                this.jgui.refreshJgui(the_worker, event); break;
            case MessageType.CanvasMake:
                CanvasUtils.makeWorkerCanvas(this, the_worker, event); break;
            case MessageType.Event:
                this.callEvent(the_worker, event); break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }

}