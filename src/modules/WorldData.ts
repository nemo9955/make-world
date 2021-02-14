
import { PlanetarySystem } from "../generate/PlanetarySystem"
import { DataBaseManager, Identifiable } from "./DataBaseManager";
import * as Convert from "../utils/Convert"

import { Config } from "./Config"
import { SpaceFactory } from "../generate/SpaceFactory";
import * as Random from "../utils/Random"
import { Orbit } from "../generate/Orbit";
import { Planet } from "../generate/Planet";
import { Star } from "../generate/Star";
import { OrbitingElement } from "../generate/OrbitingElement";
import { SpaceGroup } from "../generate/SpaceGroup";
import { SharedData } from "./SharedData";

// TODO read&write function WITH and WITHOUT structure change
// WITHOUT structure change is just update or variables values
// WITH represents a refresh/regen

// TODO Planet Star Orbit and such objects to be stored directly in DB and referenced by some UUID


export var orbit_types_ = {};
orbit_types_["PlanetarySystem"] = PlanetarySystem
orbit_types_["Orbit"] = Orbit
orbit_types_["Planet"] = Planet
orbit_types_["Star"] = Star
orbit_types_["SpaceGroup"] = SpaceGroup


export class WorldData {
    public readonly name: string;

    public planetary_system: PlanetarySystem;

    public stdBObjMap = new Map<number, any>();

    public config: Config = null;
    public dbm: DataBaseManager;

    public sharedData: SharedData = null;
    public readonly spaceFactory: SpaceFactory;

    constructor(name: string) {
        this.name = name;
        this.dbm = new DataBaseManager(name);
        this.spaceFactory = new SpaceFactory(this);

        this.planetary_system = new PlanetarySystem(this);
        // console.log("this.planetary_system.getWorldData()", this.planetary_system.getWorldData());
    }

    public async init() {
        console.debug("#HERELINE WorldData init");
        return this.dbm.init().then(() => {
            console.debug(`#HERELINE WorldData ${this.name} init then`);
            this.spread_objects();
            this.planetary_system.init();
            // this.planetary_system.setWorldData(this);
            this.setOrbElem(this.planetary_system);
            this.spaceFactory.genStartingPlanetSystem(this.planetary_system);
        })
    }

    public initWorker() {
        console.debug("#HERELINE WorldData initWorker");
        return this.dbm.open()
    }

    public spread_objects() {
        var to_spread: any[] = [this.spaceFactory]
        for (const object_ of to_spread) {
            if (object_.sharedData === null) object_.sharedData = this.sharedData;
            if (object_.config === null) object_.config = this.config;
            if (object_.world === null) object_.world = this;
        }
    }



    public static wdMaxId = -10;
    public getFreeID() {
        if (!this.sharedData) return WorldData.wdMaxId--;
        // if (!this.sharedData) return Math.ceil(Math.random() * 10000) + 1000;
        var id_ = this.sharedData.maxId++;
        // do {
        //     id_ = Math.ceil(Math.random() * 10000000) + 1000000
        // } while (this.stdBObjMap.has(id_));
        return id_;
    }

    public free(id_: number) {
        this.stdBObjMap.delete(id_)
    }

    public setOrbElem(sat_: OrbitingElement) {
        // TODO do some sanity checks !!!!!
        // console.log("sat_", sat_);
        this.stdBObjMap.set(sat_.id, sat_)
    }


    public async readShallow() {
        // console.debug("#HERELINE WorldData readShallow this.name", this.name);
        // console.time("#time WorldData " + this.name + " readShallow");

        // return this.readDeep(); // TODO WA FIXME
        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readonly");

        // var keys_from_db = []
        // var keys_from_wd = [...this.stdBObjMap.keys()]

        var all = await data_ps.store.getAll() /// var 1
        for (const iterator of all) { /// var 1
            // var cursor = data_ps.store.openCursor(); /// var 2
            // for await (const cursor of data_ps.store) { /// var 2
            //     var iterator = cursor.value; /// var 2

            // keys_from_db.push(iterator.id)
            if (iterator.type == "PlanetarySystem") {
                this.planetary_system.copyShallow(iterator)
                this.stdBObjMap.set(iterator.id, this.planetary_system)
            } else {
                const newLocal = this.stdBObjMap.get(iterator.id);
                if (!newLocal) {
                    console.warn("this.stdBObjMap", this.stdBObjMap);
                    console.warn("this", this);
                    console.warn("iterator", iterator);
                }
                newLocal.copyShallow(iterator);
            }
        }

        // keys_from_db.sort()
        // keys_from_wd.sort()

        // console.log("keys_from_db", keys_from_db);
        // console.log("keys_from_wd", keys_from_wd);


        await data_ps.done.finally(() => {
            // console.timeEnd("#time WorldData " + this.name + " readShallow");
        })
    }

    public async readDeep() {
        console.debug("#HERELINE WorldData readDeep this.name", this.name);
        console.time("#time WorldData " + this.name + " readDeep");

        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readonly");
        this.stdBObjMap.clear()

        var all = await data_ps.store.getAll() /// var 1
        for (const iterator of all) { /// var 1
            // var cursor = data_ps.store.openCursor(); /// var 2
            // for await (const cursor of data_ps.store) { /// var 2
            //     var iterator = cursor.value; /// var 2

            if (iterator.type == "PlanetarySystem") {
                this.planetary_system.copyDeep(iterator)
                this.stdBObjMap.set(iterator.id, this.planetary_system)
            } else {
                var obj_ = new orbit_types_[iterator.type](this) // wow
                this.stdBObjMap.set(iterator.id, obj_)
                const newLocal = this.stdBObjMap.get(iterator.id);
                if (!newLocal) {
                    console.warn("this.stdBObjMap", this.stdBObjMap);
                    console.warn("this", this);
                    console.warn("iterator", iterator);
                }
                newLocal.copyDeep(iterator);
            }
        }
        await data_ps.done.finally(() => {
            console.timeEnd("#time WorldData " + this.name + " readDeep");
        })
    }




    public async writeDeep() {
        console.debug("#HERELINE WorldData writeDeep this.name", this.name);
        console.time("#time WorldData " + this.name + " writeDeep");

        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");

        await data_ps.store.clear();

        var promises: Promise<any>[] = []
        for (const iterator of this.stdBObjMap.values()) {
            promises.push(data_ps.store.put(iterator))
        }

        promises.push(data_ps.done)
        await Promise.all(promises).finally(() => {
            console.timeEnd("#time WorldData " + this.name + " writeDeep");
        })
    }

    public async writeShallow() {
        // console.debug("#HERELINE WorldData writeShallow this.name", this.name);
        // console.time("#time WorldData " + this.name + " writeShallow");

        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");

        var promises: Promise<any>[] = []
        for (const iterator of this.stdBObjMap.values()) {
            promises.push(data_ps.store.put(iterator))
        }

        promises.push(data_ps.done)
        await Promise.all(promises).finally(() => {
            // console.timeEnd("#time WorldData " + this.name + " writeShallow");
        })
    }


}