
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


    public rwDbObjs = new Map<number, any>();
    public roDbObjs = new Map<number, any>();
    public roDbRaws = new Map<number, any>();
    private cleanupIds = new Array<number>();

    public config: Config = null;
    public dbm: DataBaseManager;

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

        // console.log("this.planetary_system.getWorldData()", this.planetary_system.getWorldData());
    }

    public async preInit() {
        console.debug(`#HERELINE WorldData preInit ${this.config.WORLD_DATABASE_NAME} `);
        return this.dbm.init(this.config.keepDbAtPageRefresh).then(() => {
            console.debug(`#HERELINE WorldData ${this.name} preInit then`);
        })
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

    public static wdMaxId: number = -999999;
    public getFreeID() {
        return WorldData.wdMaxId += this.config.incrementId;
    }

    public getAnyObj(id_: number) {
        if (this.rwDbObjs.has(id_))
            return this.rwDbObjs.get(id_)
        if (this.roDbObjs.has(id_))
            return this.roDbObjs.get(id_)
        return null;
    }
    public getRoObj(id_: number) {
        if (this.roDbObjs.has(id_))
            return this.roDbObjs.get(id_)
        return null;
    }
    public getRwObj(id_: number) {
        if (this.rwDbObjs.has(id_))
            return this.rwDbObjs.get(id_)
        return null;
    }

    public free(id_: number) {
        if (this.rwDbObjs.has(id_))
            this.rwDbObjs.delete(id_)
        this.cleanupIds.push(id_)
    }

    public setRwObj(obj_: Identifiable) {
        this.rwDbObjs.set(obj_.id, obj_)
    }


    // TODO Move in WorldData when more fine read/write can be done
    public readonly time = new Convert.NumberTime();

    public async readTime() {
        this.time.value = await this.getKv("world_time") as number;
        return this.time;
    }
    public async writeTime() { return this.setKv("world_time", this.time.value) }

    restartTime() {
        this.time.eby = 0;
        this.writeTime();
    }

    public async getKv(key: any) { return this.dbm.getKv(key); }
    public async setKv(key: any, val: any) { return this.dbm.setKv(key, val); }
    public async delKv(key: any) { return this.dbm.delKv(key); }
    public async clearKv() { return this.dbm.clearKv(); }
    public async keysKv() { return this.dbm.keysKv(); }

    /*

    public async readShallow() {
        // console.debug("#HERELINE WorldData readShallow this.name", this.name);
        // console.time("#time WorldData " + this.name + " readShallow");

        // return this.readDeep(); // TODO WA FIXME
        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readonly");

        // var keys_from_db = []
        // var keys_from_wd = [...this.mainDbData.keys()]

        var all = await data_ps.store.getAll() /// var 1
        for (const iterator of all) { /// var 1
            // var cursor = data_ps.store.openCursor(); /// var 2
            // for await (const cursor of data_ps.store) { /// var 2
            //     var iterator = cursor.value; /// var 2

            // keys_from_db.push(iterator.id)
            if (iterator.type == "PlanetarySystem") {
                this.planetarySystem.copyShallow(iterator)
                this.rwDbObjs.set(iterator.id, this.planetarySystem)
            } else {
                const newLocal = this.rwDbObjs.get(iterator.id);
                if (!newLocal) {
                    console.warn("this", this);
                    // console.warn("this.mainDbData", this.mainDbData);
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
        this.rwDbObjs.clear()

        var all = await data_ps.store.getAll() /// var 1
        for (const iterator of all) { /// var 1
            // var cursor = data_ps.store.openCursor(); /// var 2
            // for await (const cursor of data_ps.store) { /// var 2
            //     var iterator = cursor.value; /// var 2

            if (iterator.type == "PlanetarySystem") {
                this.planetarySystem.copyDeep(iterator)
                this.rwDbObjs.set(iterator.id, this.planetarySystem)
            } else {
                var obj_ = new objects_types_[iterator.type](this) // wow
                this.rwDbObjs.set(iterator.id, obj_)
                const newLocal = this.rwDbObjs.get(iterator.id);
                if (!newLocal) {
                    console.warn("this.mainDbData", this.rwDbObjs);
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
        for (const iterator of this.rwDbObjs.values()) {
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
        for (const iterator of this.rwDbObjs.values()) {
            promises.push(data_ps.store.put(iterator))
        }

        promises.push(data_ps.done)
        await Promise.all(promises).finally(() => {
            // console.timeEnd("#time WorldData " + this.name + " writeShallow");
        })
    }

    */


    public async delCleared() {
        console.debug(`#HERELINE WorldData delCleared this.name ${this.name} len ${this.cleanupIds.length} `);
        // console.time(`#time WorldData ${this.name} delCleared`);

        var promises: Promise<any>[] = []
        while (this.cleanupIds.length > 0) {
            var iterator = this.cleanupIds.pop()
            promises.push(this.dbm.idb.delete(DataBaseManager.STANDARD_OBJECTS, iterator))
        }

        return await Promise.all(promises)
        // .finally(() => {
        //     console.timeEnd(`#time WorldData ${this.name} delCleared`);
        // })
    }

    public async writeAllRw() {
        console.debug(`#HERELINE WorldData writeAllRw this.name ${this.name}`);
        console.time(`#time WorldData ${this.name} writeAllRw`);

        await this.delCleared();

        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");

        var promises: Promise<any>[] = []
        for (const iterator of this.rwDbObjs.values()) {
            promises.push(data_ps.store.put(iterator))
        }

        promises.push(data_ps.done)
        await Promise.all(promises).finally(() => {
            console.timeEnd(`#time WorldData ${this.name} writeAllRw`);
        })
    }


    public async setBigIdObject(obj_: Identifiable) {
        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");
        await data_ps.store.put(obj_);
        await data_ps.done;
    }

    public async getBigIdObject(id_: number) {
        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, "readwrite");
        return data_ps.store.get(id_);
    }


    public async *iterateAllBig(mode: IDBTransactionMode = "readonly") {
        console.time(`#time WorldData ${this.name} iterateAllBig`);
        console.debug(`#HERELINE WorldData iterateAllBig this.name ${this.name}`);

        var data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, mode);

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




    public async *iterObjsType<Klass>(VTYPE: ClonableConstructor<Klass>, mode: IDBTransactionMode = "readonly")
        : AsyncGenerator<Klass, void, Klass> {
        // console.time(`#time WorldData ${this.name} iterObjsType`);
        console.debug(`#HERELINE WorldData iterObjsType this.name ${this.name}`);

        const data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, mode)
        const index = data_ps.objectStore(DataBaseManager.STANDARD_OBJECTS).index('type');

        // console.log("VTYPE", VTYPE);
        var cursor = await index.openCursor((VTYPE as any).type)
        while (cursor) {
            var iterator = VTYPE.clone(this, cursor.value);

            yield iterator;
            if (mode == "readwrite") {
                // console.log("iterator", iterator);
                cursor.update(iterator);
            }
            cursor = await cursor.continue();
        }
        return await data_ps.done.finally(() => {
            // console.timeEnd(`#time WorldData ${this.name} iterObjsType`);
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
    //     const data_ps = this.dbm.idb.transaction(DataBaseManager.STANDARD_OBJECTS, mode)
    //     const index = data_ps.objectStore(DataBaseManager.STANDARD_OBJECTS).index('type');
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
