
import { PlanetarySystem } from "../generate/PlanetarySystem"
import { DataBaseManager, STransaction } from "./DataBaseManager";
import * as Convert from "../utils/Convert"

import { Config } from "./Config"
import { SpaceFactory } from "../generate/SpaceFactory";

// TODO read&write function WITH and WITHOUT structure change
// WITHOUT structure change is just update or variables values
// WITH represents a refresh/regen

// TODO Planet Star Orbit and such objects to be stored directly in DB and referenced by some UUID

export class WorldData {

    name: string;

    planetary_system: PlanetarySystem;
    dbm: DataBaseManager;

    spaceFactory = new SpaceFactory();

    constructor(name: string) {
        this.name = name;
        this.planetary_system = new PlanetarySystem();
        this.dbm = null;
    }

    // private _id: number;
    // public get id(): number { return this._id; }
    // public set id(value: number) {
    //     this._id = value;
    //     this.planetary_system.id = this._id;
    // }

    public init() {
        // console.debug("#HERELINE WorldData init");
        this.planetary_system.init()
        this.spaceFactory.genStartingPlanetSystem(this.planetary_system)
    }


    public async readShallow() {
        // console.debug("#HERELINE WorldData readShallow ");
        if (this.planetary_system.id) {
            // console.time("#time WorldData " + this.name + " read");
            // console.debug("#HERELINE WorldData read this.id", this.id);

            var data_ps = this.dbm.transaction(DataBaseManager.PLANET_SYSTEM, "readonly");
            var ps_db = await data_ps.store.get(this.planetary_system.id)
            await data_ps.done()
            this.planetary_system.copyShallow(ps_db)

            // console.timeEnd("#time WorldData " + this.name + " read");
            // return data_ps.done()
            return Promise.resolve();
        }
        return Promise.reject("NO ID : " + this.planetary_system.id);
    }

    public async readDeep() {
        console.debug("#HERELINE WorldData readDeep ");
        if (this.planetary_system.id) {
            // console.time("#time WorldData " + this.name + " read");
            // console.debug("#HERELINE WorldData read this.id", this.id);

            var data_ps = this.dbm.transaction(DataBaseManager.PLANET_SYSTEM, "readonly");
            var ps_db = await data_ps.store.get(this.planetary_system.id)
            await data_ps.done()
            this.planetary_system.copyDeep(ps_db)

            // console.timeEnd("#time WorldData " + this.name + " read");
            // return data_ps.done()
            return Promise.resolve();
        }
        return Promise.reject("NO ID : " + this.planetary_system.id);
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