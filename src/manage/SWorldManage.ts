
import { SWorldGui } from "../gui/SWorldGui"
import { SWorldData } from "../data/SWorldData"
import { SWorldWorkerManager } from "../worker/SWorldWorkerManager"


/*
* Used to store and send VERRY simple data across the main thread and workers
*/
export class SWorldConfig {
    update_draw: boolean = true
}

export class SWorldManage {

    gui: SWorldGui;
    world: SWorldData;
    work_mng: SWorldWorkerManager;
    config: SWorldConfig;

    constructor() {

        this.world = new SWorldData();
        this.gui = new SWorldGui();
        this.work_mng = new SWorldWorkerManager();
        this.config = new SWorldConfig();

        this.gui.manager = this;
        this.work_mng.manager = this;

    }

    public init() {
        this.world.init()
        this.work_mng.init()
        this.gui.init()
    }

    public update_config() {
        this.work_mng.draw_update()
    }

}