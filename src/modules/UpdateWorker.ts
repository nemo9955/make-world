


import { WorldData } from "./WorldData"
import { UpdateWorld } from "./UpdateWorld"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { DataBaseManager } from "./DataBaseManager"

import { Config, MessageType } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"





export class UpdateWorker {

    world: WorldData;
    config: Config;
    dbm: DataBaseManager;
    worker: Worker;

    update_world: UpdateWorld;
    is_updating: boolean = false;

    constructor(worker: Worker) {
        this.worker = worker;
        this.dbm = new DataBaseManager();
        this.world = new WorldData();
        this.config = new Config();
        this.update_world = new UpdateWorld();
    }

    public init() {
        this.spread_objects()
        this.dbm.open().then(() => {
            this.worker.postMessage({ message: MessageType.Ready, from: "UpdateWorker" });
        })
    }

    public spread_objects() {
        this.world.id = this.config.WorldDataID

        var to_spread: any[] = [this.world, this.update_world]
        for (const object_ of to_spread) {
            if (object_.config === null) object_.config = this.config
            if (object_.world === null) object_.world = this.world
            if (object_.dbm === null) object_.dbm = this.dbm
        }
    }


    public get_message(event: MessageEvent) {
        console.debug("#HERELINE UpdateWorker get_message ", event.data.message);
        if (event?.data?.config && this.config)
            this.config.copy(event.data.config as Config)

        switch (event.data.message as MessageType) {
            case MessageType.InitWorker:
                this.init(); break;
            case MessageType.RefreshDB:
                this.refresh_db(event); break;
            case MessageType.RefreshConfig:
                this.update(); break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }


    public async refresh_db(event?: MessageEvent) {
        console.debug("#HERELINE UpdateWorker refresh_db this.dbm.idb ready", !!this.dbm.idb);
        if (!this.dbm.idb) return;

        await this.world.read();
        this.update();
    }



    private update() {
        console.debug("#HERELINE UpdateWorker update ");
        console.time("#time UpdateWorker update");

        if (this.config.do_update_loop && this.is_updating == false) this.update_loop();
        else this.is_updating = this.config.do_update_loop;

        console.timeEnd("#time UpdateWorker update");
    }

    private update_loop() {
        if (this.config.do_update_loop) {
            this.is_updating = this.config.do_update_loop;
            setTimeout(() => { this.update_loop() }, 500);
        }

        this.update_world.update();

    }




}