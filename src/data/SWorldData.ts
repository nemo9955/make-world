
import { PlanetarySystem } from "../generate/PlanetarySystem"
import { SWorldDBManager, STransaction, PLANET_SYSTEM } from "../manage/SWorldDBManager";
import { SWorldManager, SWorldConfig } from "../manage/SWorldManager"


export class SWorldData {

    planetary_system: PlanetarySystem;
    dbm: SWorldDBManager;
    config: SWorldConfig;

    private _manager: SWorldManager;
    public get manager(): SWorldManager { return this._manager; }
    public set manager(value: SWorldManager) {
        this._manager = value;
        this.config = this._manager.config;
        this.dbm = this._manager.dbm;
    }

    constructor() {
        this.planetary_system = new PlanetarySystem();
    }

    public init() {
        this.planetary_system.genStar()
        this.config.world_id = this.planetary_system.id
    }

    public init_worker() {
        console.log("this.dbm", this.dbm);
        console.log("WORLD DATA init_worker !!!!!!!!!!!!");
        this.read()
    }

    public async read() {
        console.log("WORLD DATA READ WORKER !!!!!!!!!!!!");
        console.log("this.dbm", this.dbm);
        var data = this.dbm.transaction(PLANET_SYSTEM, "readwrite");
        var ps_db = await data.store.get(this.config.world_id)
        console.log("ps_db", ps_db);
        // data.store.get("id", this.config.world_id)
        // data.done()
    }

    public write() {
        var data = this.dbm.transaction(PLANET_SYSTEM, "readwrite");
        data.store.put(this.planetary_system)
        data.done()
    }

}