
import { PlanetarySystem } from "../generate/PlanetarySystem"
import { DataBaseManager } from "./DataBaseManager";
import * as Convert from "../utils/Convert"

import { Config } from "./Config"
import { SpaceFactory } from "../generate/SpaceFactory";
import * as Random from "../utils/Random"
import { Orbit } from "../generate/Orbit";
import { Planet } from "../generate/Planet";
import { Star } from "../generate/Star";
import { OrbitingElement } from "../generate/OrbitingElement";
import { SpaceGroup } from "../generate/SpaceGroup";
import { Terrain } from "../generate/Terrain";
import { ClonableConstructor, Identifiable } from "./ObjectsHacker";
import { StoreKey } from "idb";

// TODO read&write function WITH and WITHOUT structure change
// WITHOUT structure change is just update or variables values
// WITH represents a refresh/regen

// TODO Planet Star Orbit and such objects to be stored directly in DB and referenced by some UUID

// TODO do not use function.name and constructor.name so minified can be used
// https://stackoverflow.com/questions/50267543/class-name-always-e-for-every-class-after-uglify-webpack-for-production


export var objects_types_ = {};
objects_types_["PlanetarySystem"] = PlanetarySystem
objects_types_["Orbit"] = Orbit
objects_types_["Planet"] = Planet
objects_types_["Star"] = Star
objects_types_["SpaceGroup"] = SpaceGroup
objects_types_["Terrain"] = Terrain



export class WorldData {
    public readonly name: string;
    public readonly type = this.constructor.name;

    public planetarySystem: PlanetarySystem;

    public idObjMap = new Map<number, any>();

    public config: Config = null;
    public dbm: DataBaseManager;

    public readonly spaceFactory: SpaceFactory;
    public readonly startId: number;

    constructor(targetTable: string, name: string, startId: number, config: Config) {
        this.name = name;
        this.startId = startId;
        this.config = config;

        if (WorldData.wdMaxId > 0)
            console.error(`WorldData.wdMaxId was already set, it should be set only one per worker : ${WorldData.wdMaxId}`, this);
        WorldData.wdMaxId = this.startId;
        console.debug("this.startId", this.startId);

        this.dbm = new DataBaseManager(targetTable, name);
        this.spaceFactory = new SpaceFactory(this);

        this.planetarySystem = new PlanetarySystem(this);
        // console.log("this.planetary_system.getWorldData()", this.planetary_system.getWorldData());
    }

    public async preInit() {
        console.debug(`#HERELINE WorldData preInit ${this.config.WORLD_DATABASE_NAME} `);
        return this.dbm.init(this.config.keepDbAtPageRefresh).then(() => {
            console.debug(`#HERELINE WorldData ${this.name} preInit then`);
            this.spread_objects();
        })
    }

    public async initPlSys() {
        console.debug("#HERELINE WorldData initPlSys");
        if (this.config.keepDbAtPageRefresh) {
            // return this.readDeep();
        } else {
            this.planetarySystem.init();
            /////////// this.planetary_system.setWorldData(this);
            /////////// this.setOrbElem(this.planetary_system);
            this.spaceFactory.genStartingPlanetSystem(this.planetarySystem);
            return Promise.resolve();
        }
        return Promise.reject();
    }

    // public async initTerrain() {
    //     console.debug("#HERELINE WorldData initTerrain");
    //     for (const element of this.planetarySystem.getAllSats()) {
    //         if (element instanceof Planet && element.isInHabZone) {
    //             if (element.planetType == "Normal") {
    //                 Terrain.initForPlanet(element);
    //                 return; // TODO TMP FIXME limit to 1 terrain while testing !!!!!!!!!!!!!!!!!
    //             }
    //         }
    //     }
    // }

    public initWorker() {
        console.debug("#HERELINE WorldData initWorker");
        return this.dbm.open()
    }

    public spread_objects() {
        var to_spread: any[] = [this.spaceFactory]
        for (const object_ of to_spread) {
            if (object_.planetarySystem === null) object_.planetarySystem = this.planetarySystem;
            if (object_.config === null) object_.config = this.config;
            if (object_.world === null) object_.world = this;
        }
    }



    public static wdMaxId: number = -999999;
    public getFreeID() {
        return WorldData.wdMaxId += this.config.incrementId;
        // if (!this.sharedData) return Math.ceil(Math.random() * 10000) + 1000;
        // var id_ = this.sharedData.maxId++;
        // while (this.idObjMap.has(id_))
        //     id_ = this.sharedData.maxId++;
        // return id_;
    }

    public free(id_: number) {
        this.idObjMap.delete(id_)
    }

    public setIdObject(obj_: Identifiable) {
        this.idObjMap.set(obj_.id, obj_)
    }


    public async readShallow() {
        // console.debug("#HERELINE WorldData readShallow this.name", this.name);
        // console.time("#time WorldData " + this.name + " readShallow");

        // return this.readDeep(); // TODO WA FIXME
        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readonly");

        // var keys_from_db = []
        // var keys_from_wd = [...this.idObjMap.keys()]

        var all = await data_ps.store.getAll() /// var 1
        for (const iterator of all) { /// var 1
            // var cursor = data_ps.store.openCursor(); /// var 2
            // for await (const cursor of data_ps.store) { /// var 2
            //     var iterator = cursor.value; /// var 2

            // keys_from_db.push(iterator.id)
            if (iterator.type == "PlanetarySystem") {
                this.planetarySystem.copyShallow(iterator)
                this.idObjMap.set(iterator.id, this.planetarySystem)
            } else {
                const newLocal = this.idObjMap.get(iterator.id);
                if (!newLocal) {
                    console.warn("this", this);
                    // console.warn("this.idObjMap", this.idObjMap);
                    // console.warn("iterator", iterator);
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
        console.debug(`#HERELINE WorldData readDeep this.name ${this.name}`);
        console.time(`#time WorldData ${this.name} readDeep`);

        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readonly");
        this.idObjMap.clear()

        var all = await data_ps.store.getAll() /// var 1
        for (const iterator of all) { /// var 1
            // var cursor = data_ps.store.openCursor(); /// var 2
            // for await (const cursor of data_ps.store) { /// var 2
            //     var iterator = cursor.value; /// var 2

            if (iterator.type == "PlanetarySystem") {
                this.planetarySystem.copyDeep(iterator)
                this.idObjMap.set(iterator.id, this.planetarySystem)
            } else {
                var obj_ = new objects_types_[iterator.type](this) // wow
                this.idObjMap.set(iterator.id, obj_)
                const newLocal = this.idObjMap.get(iterator.id);
                if (!newLocal) {
                    console.warn("this.idObjMap", this.idObjMap);
                    console.warn("this", this);
                    console.warn("iterator", iterator);
                }
                newLocal.copyDeep(iterator);
            }
        }
        await data_ps.done.finally(() => {
            console.timeEnd(`#time WorldData ${this.name} readDeep`);
        })
    }




    public async writeDeep() {
        console.debug(`#HERELINE WorldData writeDeep this.name ${this.name}`);
        console.time(`#time WorldData ${this.name} writeDeep`);

        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");

        await data_ps.store.clear();

        var promises: Promise<any>[] = []
        for (const iterator of this.idObjMap.values()) {
            promises.push(data_ps.store.put(iterator))
        }

        promises.push(data_ps.done)
        await Promise.all(promises).finally(() => {
            console.timeEnd(`#time WorldData ${this.name} writeDeep`);
        })
    }

    public async writeShallow() {
        // console.debug("#HERELINE WorldData writeShallow this.name", this.name);
        // console.time("#time WorldData " + this.name + " writeShallow");

        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");

        var promises: Promise<any>[] = []
        for (const iterator of this.idObjMap.values()) {
            promises.push(data_ps.store.put(iterator))
        }

        promises.push(data_ps.done)
        await Promise.all(promises).finally(() => {
            // console.timeEnd("#time WorldData " + this.name + " writeShallow");
        })
    }






    public async setBigIdObject(obj_: Identifiable) {
        var data_ps = this.dbm.idb.transaction(DataBaseManager.BIG_OBJECTS, "readwrite");
        await data_ps.store.put(obj_);
        await data_ps.done;
    }

    public async getBigIdObject(id_: number): Promise<Identifiable> {
        var data_ps = this.dbm.idb.transaction(DataBaseManager.BIG_OBJECTS, "readwrite");
        return await data_ps.store.get(id_);
    }


    public async *iterateAllBig(mode: IDBTransactionMode = "readonly") {
        console.time(`#time WorldData ${this.name} iterateAllBig`);
        console.debug(`#HERELINE WorldData iterateAllBig this.name ${this.name}`);

        var data_ps = this.dbm.idb.transaction(DataBaseManager.BIG_OBJECTS, mode);

        var cursor = await data_ps.store.openCursor();
        while (cursor) {
            // console.log("cursor.key, cursor.value", cursor.key, cursor.value);
            var iterator = cursor.value;
            yield iterator;
            cursor.update(iterator);
            cursor = await cursor.continue();

        }
        await data_ps.done.finally(() => {
            console.timeEnd(`#time WorldData ${this.name} iterateAllBig`);
        })
    }




    public async *iterateAllBigType<Klass>(VTYPE: ClonableConstructor<Klass>, mode: IDBTransactionMode = "readonly")
        : AsyncGenerator<Klass, void, unknown> {
        // console.time(`#time WorldData ${this.name} iterateAllBigType`);
        console.debug(`#HERELINE WorldData iterateAllBigType this.name ${this.name}`);

        const data_ps = this.dbm.idb.transaction(DataBaseManager.BIG_OBJECTS, mode)
        const index = data_ps.objectStore(DataBaseManager.BIG_OBJECTS).index('type');

        var cursor = await index.openCursor((VTYPE as any).name)
        while (cursor) {
            var iterator = VTYPE.clone(this, cursor.value);

            yield iterator;
            cursor.update(iterator);
            cursor = await cursor.continue();

        }
        await data_ps.done.finally(() => {
            // console.timeEnd(`#time WorldData ${this.name} iterateAllBigType`);
        })
    }



    // public async *iterateAllBigType2<RTYPE>(VTYPE: any, mode: IDBTransactionMode = "readonly")
    //     : AsyncGenerator<RTYPE, void, unknown> {
    //     // for await (const iterator of this.world.iterateAllBigType2<Terrain>(Terrain, "readwrite")) {
    //     //     console.log("iterator2222222222222", iterator);
    //     //     // iterator = Terrain.clone(this.world, iterator);
    //     //     iterator.test += 10;
    //     // }
    //     console.time(`#time WorldData ${this.name} iterateAllBigType2`);
    //     console.debug(`#HERELINE WorldData iterateAllBigType2 this.name ${this.name}`);
    //     const data_ps = this.dbm.idb.transaction(DataBaseManager.BIG_OBJECTS, mode)
    //     const index = data_ps.objectStore(DataBaseManager.BIG_OBJECTS).index('type');
    //     var cursor = await index.openCursor(VTYPE.name)
    //     while (cursor) {
    //         var iterator = VTYPE.clone(this, cursor.value);
    //         yield iterator as typeof VTYPE;
    //         cursor.update(iterator);
    //         cursor = await cursor.continue();
    //     }
    //     await data_ps.done.finally(() => {
    //         console.timeEnd(`#time WorldData ${this.name} iterateAllBigType2`);
    //     })
    // }


}
