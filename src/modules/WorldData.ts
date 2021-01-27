
import { PlanetarySystem } from "../generate/PlanetarySystem"
import { DataBaseManager, Identifiable, STransaction } from "./DataBaseManager";
import * as Convert from "../utils/Convert"

import { Config } from "./Config"
import { SpaceFactory } from "../generate/SpaceFactory";
import * as Random from "../utils/Random"
import { Orbit, OrbitingElement } from "../generate/Orbit";
import { Planet } from "../generate/Planet";
import { Star } from "../generate/Star";

// TODO read&write function WITH and WITHOUT structure change
// WITHOUT structure change is just update or variables values
// WITH represents a refresh/regen

// TODO Planet Star Orbit and such objects to be stored directly in DB and referenced by some UUID


export var orbit_types_ = {};

orbit_types_["PlanetarySystem"] = PlanetarySystem
orbit_types_["Orbit"] = Orbit
orbit_types_["Planet"] = Planet
orbit_types_["Star"] = Star


export class WorldData {

    public static instance: WorldData = null;

    name: string;

    planetary_system: PlanetarySystem;

    stdBObjMap = new Map<number, any>();
    stdBObjDelIds = []

    dbm: DataBaseManager;

    spaceFactory = new SpaceFactory();

    constructor(name: string) {
        WorldData.instance = this;

        this.name = name;
        this.planetary_system = new PlanetarySystem();
        // this.planetary_system.getWorldData = () => {return this};
        this.dbm = null;
    }

    getFreeID() {
        var id_ = null;
        do {
            id_ = Math.ceil(Math.random() * 10000000) + 1000000
        } while (this.stdBObjMap.has(id_));
        return id_;
    }

    public init() {
        // console.debug("#HERELINE WorldData init");
        this.planetary_system.init()
        this.spaceFactory.genStartingPlanetSystem(this.planetary_system)
    }

    free(id_: number) {
        this.stdBObjMap.delete(id_)
        this.stdBObjDelIds.push(id_)
    }

    addSat(sat_: OrbitingElement) {
        // TODO do some sanity checks !!!!!
        // console.log("sat_", sat_);
        this.stdBObjMap.set(sat_.id, sat_)
    }


    public async readShallow() {
        // console.debug("#HERELINE WorldData readShallow ");
        if (this.planetary_system.id) {
            // console.time("#time WorldData " + this.name + " read");
            // console.debug("#HERELINE WorldData read this.id", this.id);

            // TODO FIXME DB not properly syncked while regenerating orbits

            var data_ps = this.dbm.transaction(DataBaseManager.STANDARD_OBJECTS, "readonly");
            var all = await data_ps.store.getAll()
            // console.log("SHA all", all);

            // console.log("orbit_types_", orbit_types_);
            for (const iterator of all) {
                // console.log("iterator", iterator);
                if (iterator.type == "PlanetarySystem") {
                    this.planetary_system.copyShallow(iterator)
                } else {
                    const newLocal = this.stdBObjMap.get(iterator.id);
                    if (!newLocal) {
                        console.warn("this.stdBObjMap", this.stdBObjMap);
                        console.warn("this", this);
                        console.warn("iterator", iterator);
                    }
                    newLocal.copyShallow(iterator);
                }
                // console.log("this.stdBObjMap.get(iterator.id)", this.stdBObjMap.get(iterator.id));
            }
            await data_ps.done()


            // var data_ps = this.dbm.transaction(DataBaseManager.STANDARD_OBJECTS, "readonly");
            // var ps_db = await data_ps.store.get(this.planetary_system.id)
            // await data_ps.done()
            // this.planetary_system.copyShallow(ps_db)

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

            var data_ps = this.dbm.transaction(DataBaseManager.STANDARD_OBJECTS, "readonly");
            var all_orig = await data_ps.store.getAll()
            var all = [...all_orig]
            // console.log("all", all);

            this.stdBObjMap.clear()

            // console.log("orbit_types_", orbit_types_);
            for (const iterator of all) {
                // console.log("iterator", iterator);
                if (iterator.type == "PlanetarySystem") {
                    this.planetary_system.copyDeep(iterator)
                } else {
                    var obj_ = orbit_types_[iterator.type].new()
                    this.stdBObjMap.set(iterator.id, obj_)
                }
            }
            for (const iterator of all) {
                // console.log("iterator", iterator);
                if (iterator.type == "PlanetarySystem") {
                    // this.planetary_system.copyDeep(iterator)
                } else {
                    const newLocal = this.stdBObjMap.get(iterator.id);
                    if (!newLocal) {
                        console.warn("this.stdBObjMap", this.stdBObjMap);
                        console.warn("this", this);
                        console.warn("iterator", iterator);
                    }
                    newLocal.copyDeep(iterator);
                }
                // console.log("this.stdBObjMap.get(iterator.id)", this.stdBObjMap.get(iterator.id));
            }
            await data_ps.done()


            // var ps_db = await data_ps.store.get(this.planetary_system.id)
            // await data_ps.done()
            // this.planetary_system.copyDeep(ps_db)

            // console.timeEnd("#time WorldData " + this.name + " read");
            // return data_ps.done()
            return Promise.resolve();
        }
        return Promise.reject("NO ID : " + this.planetary_system.id);
    }




    public async writeDeep() {
        // console.time("#time WorldData " + this.name + " writeDeep");
        // console.debug("#HERELINE WorldData writeDeep this.id", this.id);

        var data_ps = this.dbm.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");

        await data_ps.store.clear();
        // while (this.stdBObjDelIds.length > 0) {
        //     // remove deteleted objects from DB
        //     var toDel = this.stdBObjDelIds.pop()
        //     data_ps.store.delete(toDel)
        // }

        await data_ps.store.put(this.planetary_system)
        // console.log("this.stdBObjMap", this.stdBObjMap);
        for (const iterator of this.stdBObjMap.values()) {
            // console.log("iterator", iterator);
            await data_ps.store.put(iterator)
        }
        // this.stdBObjMap.forEach((obj_)=>{
        //     console.log("obj_", obj_);
        // })
        // for (const iterator in this.stdBObjMap) {
        //     console.log("iterator", iterator);
        //     data_ps.store.put(iterator)
        // }

        await data_ps.done()

        // console.timeEnd("#time WorldData " + this.name + " writeDeep");
        // return data_ps.done()
        return Promise.resolve();
    }

    public async writeShallow() {
        // console.time("#time WorldData " + this.name + " writeShallow");
        // console.debug("#HERELINE WorldData writeShallow this.id", this.id);

        var data_ps = this.dbm.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");

        // await data_ps.store.clear();
        // while (this.stdBObjDelIds.length > 0) {
        //     // remove deteleted objects from DB
        //     var toDel = this.stdBObjDelIds.pop()
        //     data_ps.store.delete(toDel)
        // }

        await data_ps.store.put(this.planetary_system)
        // console.log("this.stdBObjMap", this.stdBObjMap);
        for (const iterator of this.stdBObjMap.values()) {
            // console.log("iterator", iterator);
             data_ps.store.put(iterator)
        }
        // this.stdBObjMap.forEach((obj_)=>{
        //     console.log("obj_", obj_);
        // })
        // for (const iterator in this.stdBObjMap) {
        //     console.log("iterator", iterator);
        //     data_ps.store.put(iterator)
        // }

        await data_ps.done()

        // console.timeEnd("#time WorldData " + this.name + " writeShallow");
        // return data_ps.done()
        return Promise.resolve();
    }


}