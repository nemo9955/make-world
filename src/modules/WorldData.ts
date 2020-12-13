
import { PlanetarySystem } from "../generate/PlanetarySystem"
import { DataBaseManager, STransaction, PLANET_SYSTEM } from "./DataBaseManager";


import { Config } from "./Config"
export class WorldData {

    planetary_system: PlanetarySystem;
    dbm: DataBaseManager;
    config: Config;

    constructor() {
        this.planetary_system = new PlanetarySystem();
    }

    public init() {
        this.planetary_system.genStar()
        this.planetary_system.genOrbitsSimple()
        this.config.world_id = this.planetary_system.id
    }

    public init_worker() {
        this.read()
    }

    public async read() {
        var data = this.dbm.transaction(PLANET_SYSTEM, "readwrite");
        var ps_db = await data.store.get(this.config.world_id)

        this.planetary_system.clone(ps_db as PlanetarySystem)

        // console.log("this.planetary_system", this.planetary_system);

        // data.store.get("id", this.config.world_id)
        data.done()
    }

    public write() {
        var data = this.dbm.transaction(PLANET_SYSTEM, "readwrite");
        data.store.put(this.planetary_system)
        data.done()
    }

}