
import { SWorldGui } from "../gui/SWorldGui"
import { SWorldData } from "../data/SWorldData"
import { SWorldWorkerManager } from "../worker/SWorldWorkerManager"
import { SWorldDBManager } from "../manage/SWorldDBManager"


/*
* Used to store and send VERRY simple data across the main thread and workers
*/
export class SWorldConfig {
    update_draw: boolean = true
    world_id: number
}

export class SWorldManager {

    gui: SWorldGui;
    world: SWorldData;
    work_mng: SWorldWorkerManager;
    config: SWorldConfig;
    dbm: SWorldDBManager;

    constructor() { }

    public async init_main() {
        this.dbm = new SWorldDBManager();
        this.world = new SWorldData();
        this.gui = new SWorldGui();
        this.work_mng = new SWorldWorkerManager();
        this.config = new SWorldConfig();

        await this.dbm.init()

        this.world.manager = this;
        this.gui.manager = this;
        this.work_mng.manager = this;

        this.world.init();
        this.work_mng.init();
        this.gui.init();

        this.write();
    }

    public async init_worker() {
        this.dbm = new SWorldDBManager();
        this.world = new SWorldData();
        this.config = new SWorldConfig();
        await this.dbm.open()
    }

    public update_config() {
        this.work_mng.draw_update()
    }

    public read() {
        this.world.read();
    }

    public write() {
        this.world.write();
    }

}