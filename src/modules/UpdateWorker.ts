


import { WorldData } from "./WorldData"
import { UpdateWorld } from "./UpdateWorld"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { DataBaseManager } from "./DataBaseManager"

import { Config, MessageType } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"



import { Intervaler, Ticker } from "../utils/Time"
import { SharedData } from "./SharedData";



export class UpdateWorker {
    sharedData = new SharedData();

    world: WorldData;
    config: Config;
    worker: Worker;

    db_read_itv = new Intervaler();
    update_world: UpdateWorld;
    ticker: Ticker;

    constructor(worker: Worker) {
        this.worker = worker;
        this.world = new WorldData("UpdateWorker");
        this.config = new Config();
        this.update_world = new UpdateWorld();
        this.ticker = new Ticker(false, this.refreshShallow.bind(this), Units.LOOP_INTERVAL, Units.LOOP_INTERVAL * 0.1)
    }

    public init() {
        this.spread_objects()
        this.world.initWorker().then(() => {
            this.worker.postMessage({ message: MessageType.Ready, from: "UpdateWorker" });
        })
    }


    public spread_objects() {
        // TODO make generic function ???
        this.world.planetary_system.id = this.config.WorldPlanetarySystemID

        var to_spread: any[] = [this.world, this.update_world]
        for (const object_ of to_spread) {
            if (object_.config === null) object_.sharedData = this.sharedData
            if (object_.config === null) object_.config = this.config
            if (object_.world === null) object_.world = this.world
        }
    }


    public get_message(event: MessageEvent) {
        console.debug("#HERELINE UpdateWorker get_message ", event.data.message);
        if (event?.data?.config && this.config)
            this.config.copy(event.data.config as Config)

        const message_ = (event.data.message as MessageType);
        switch (message_) {
            case MessageType.InitWorker:
                this.init(); break;
            case MessageType.Pause:
                this.pause(); break;
            case MessageType.RefreshDBDeep:
            case MessageType.RefreshDBShallow:
                this.refreshDb(event, message_); break;
            case MessageType.RefreshConfig:
                this.refreshConfig(); break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }

    public async pause() {
        this.ticker.stop();
    }

    public async refreshConfig() {
        this.ticker.updateState(this.config.do_update_loop && this.config.globalIsReady)
    }

    public async refreshDb(event: MessageEvent, refreshType: MessageType) {
        console.debug("#HERELINE UpdateWorker refreshDb ready", refreshType);
        console.time("#time UpdateWorker refreshDb " + refreshType);

        await this.refreshConfig();
        var doSpecial = false;

        var prom: Promise<void> = null
        if (refreshType == MessageType.RefreshDBDeep)
            prom = this.refreshDeep(doSpecial);
        if (refreshType == MessageType.RefreshDBShallow)
            prom = this.refreshShallow(doSpecial);

        await prom.finally(() => {
            console.timeEnd("#time UpdateWorker refreshDb " + refreshType);
        })
    }


    private async refreshDeep(doSpecial = true) {
        console.debug("#HERELINE UpdateWorker refreshDeep");
        await this.world.readDeep();
        if (doSpecial) {
            this.update_world.update();
            await this.world.writeShallow();
            this.tellMainToUpdate();
        }
    }

    private async refreshShallow(doSpecial = true) {
        // console.debug("#HERELINE UpdateWorker refreshShallow");
        await this.world.readShallow();
        if (doSpecial) {
            this.update_world.update();
            await this.world.writeShallow();
            this.tellMainToUpdate();
        }
    }

    private tellMainToUpdate() {
        // console.debug("#HERELINE UpdateWorker tellMainToUpdate");
        // TODO tell more exactly what and how to update !!!!
        this.worker.postMessage({ message: MessageType.RefreshDBShallow });
    }




}