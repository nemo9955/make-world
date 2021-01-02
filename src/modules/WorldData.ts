
import { PlanetarySystem } from "../generate/PlanetarySystem"
import { DataBaseManager, STransaction } from "./DataBaseManager";
import * as Convert from "../utils/Convert"

import { Config } from "./Config"

export class WorldData {

    private _id: number;
    name: string;

    planetary_system: PlanetarySystem;
    dbm: DataBaseManager;

    constructor(name: string) {
        this.name = name;
        this.planetary_system = new PlanetarySystem();
        this.dbm = null;
    }

    public get id(): number { return this._id; }
    public set id(value: number) {
        this._id = value;
        this.planetary_system.id = this._id;
    }

    public init() {
        // console.debug("#HERELINE WorldData init");
        this.id = Math.ceil(Math.random() * 10000) + 1000
        this.planetary_system.genStar()
        this.planetary_system.genOrbitsSimple()
    }


    public async read() {
        // console.debug("#HERELINE WorldData read ");
        if (this.id) {
            // console.time("#time WorldData " + this.name + " read");
            // console.debug("#HERELINE WorldData read this.id", this.id);

            var data_ps = this.dbm.transaction(DataBaseManager.PLANET_SYSTEM, "readonly");
            var ps_db = await data_ps.store.get(this.id)
            await data_ps.done()
            this.planetary_system.copy(ps_db)

            // console.timeEnd("#time WorldData " + this.name + " read");
            // return data_ps.done()
            return Promise.resolve();
        }
        return Promise.reject("NO ID : " + this.id);
    }

    public async write() {
        // console.time("#time WorldData " + this.name + " write");
        // console.debug("#HERELINE WorldData write this.id", this.id);

        var data_ps = this.dbm.transaction(DataBaseManager.PLANET_SYSTEM, "readwrite");
        await data_ps.store.put(this.planetary_system)
        await data_ps.done()

        // console.timeEnd("#time WorldData " + this.name + " write");
        // return data_ps.done()
        return Promise.resolve();
    }
}