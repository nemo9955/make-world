


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
    shared_data = new SharedData();

    world: WorldData;
    config: Config;
    dbm: DataBaseManager;
    worker: Worker;

    db_read_itv = new Intervaler();
    update_world: UpdateWorld;
    update_tick: Ticker;

    constructor(worker: Worker) {
        this.worker = worker;
        this.dbm = new DataBaseManager();
        this.world = new WorldData("UpdateWorker");
        this.config = new Config();
        this.update_world = new UpdateWorld();
        this.update_tick = new Ticker(false, this.update_loop.bind(this), Units.LOOP_INTERVAL)
    }

    public init() {
        this.spread_objects()
        this.dbm.open().then(() => {
            this.worker.postMessage({ message: MessageType.Ready, from: "UpdateWorker" });
        })
    }

    public spread_objects() {
        // TODO make generic function ???
        this.world.planetary_system.id = this.config.WorldPlanetarySystemID

        var to_spread: any[] = [this.world, this.update_world]
        for (const object_ of to_spread) {
            if (object_.config === null) object_.shared_data = this.shared_data
            if (object_.config === null) object_.config = this.config
            if (object_.world === null) object_.world = this.world
            if (object_.dbm === null) object_.dbm = this.dbm
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
            case MessageType.RefreshDBDeep:
            case MessageType.RefreshDBShallow:
                this.refresh_db(event, message_); break;
            case MessageType.RefreshConfig:
                this.update(); break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }


    public async refresh_db(event: MessageEvent, refreshType: MessageType) {
        console.debug("#HERELINE UpdateWorker refresh_db this.dbm.idb ready", !!this.dbm.idb, refreshType);
        if (!this.dbm.idb) return;

        if (refreshType == MessageType.RefreshDBDeep)
            await this.world.readDeep();
        if (refreshType == MessageType.RefreshDBShallow)
            await this.world.readShallow();

        this.update();
    }



    private update() {
        console.debug("#HERELINE UpdateWorker update ");
        console.time("#time UpdateWorker update");

        this.update_tick.updateState(this.config.do_update_loop)
        console.timeEnd("#time UpdateWorker update");
    }

    private update_loop() {
        this.update_world.update();

        // if (this.db_read_itv.check(WRITE_DB_INTERVAL)) {
        // this.refresh_db();
        // this.world.write(); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        this.world.writeShallow(); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // }
    }




}