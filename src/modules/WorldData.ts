
import { PlanetarySystem } from "../generate/PlanetarySystem"
import { DataBaseManager, STransaction, PLANET_SYSTEM } from "./DataBaseManager";


import { Config } from "./Config"
export class WorldData {

    private _id: number;

    planetary_system: PlanetarySystem;
    dbm: DataBaseManager;

    constructor() {
        this.planetary_system = new PlanetarySystem();
        this.dbm = null;
    }

    public get id(): number { return this._id; }
    public set id(value: number) {
        this._id = value;
        this.planetary_system.id = this._id;
    }

    public init() {
        console.debug("#HERELINE WorldData init");
        this.id = Math.ceil(Math.random() * 10000) + 1000
        this.planetary_system.genStar()
        this.planetary_system.genOrbitsSimple()
    }

    public async read() {
        console.debug("#HERELINE WorldData read ");

        if (this.id) {
            // console.trace("#HERELINE WorldData read this.id", this.id);
            var data = this.dbm.transaction(PLANET_SYSTEM, "readwrite");
            var ps_db = await data.store.get(this.id)
            this.planetary_system.copy(ps_db)
        }

        await data.done()
    }

    public async write() {
        console.debug("#HERELINE WorldData write ");
        var data = this.dbm.transaction(PLANET_SYSTEM, "readwrite");
        await data.store.put(this.planetary_system)
        await data.done()
    }

}