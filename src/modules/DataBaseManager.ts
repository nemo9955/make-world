
import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, IDBPTransaction, IDBPObjectStore, StoreKey, StoreValue } from 'idb';
// import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, IDBPTransaction, IDBPObjectStore, StoreKey, StoreValue } from 'idb/with-async-ittr.js';


/*
TODO Make tables "universe" specific , the ones that ID is needed
TODO better split databases for different usages for more efficient read-write

Examples:
DB only for OrbitElements and load all of them since they are small
DB only for Terrain/Big objects and load one by one sice they are big, so
    read -> make_object -> manage -> write -> destroy_object

*/
export class DataBaseManager {
    public readonly name: string;
    public idb: IDBPDatabase<unknown>;

    public static STANDARD_OBJECTS = "STANDARD_OBJECTS";
    public static BIG_OBJECTS = "BIG_OBJECTS";
    public TABLE_NAME = "world_table";

    constructor(name: string) {
        this.name = name;
        this.idb = null;
    }

    public async init(keepDb: boolean) {
        console.debug(`#HERELINE DataBaseManager ${this.name} init `);

        var prom_: Promise<void> = null;
        if (keepDb) prom_ = Promise.resolve();
        else prom_ = this.delete()

        return prom_.then(() => {
            console.debug(`#HERELINE DataBaseManager ${this.name} init then  `);
            return this.open();
        })
    }

    public async open() {
        console.debug(`#HERELINE DataBaseManager ${this.name} open `);
        this.idb = await openDB(this.TABLE_NAME, 1, {
            upgrade(db) {
                console.debug("#HERELINE DataBaseManager NOTHEN open upgrade ");
                // this.idb = db;
                // TODO, make generic container with ID-able objects
                if (!db.objectStoreNames.contains(DataBaseManager.STANDARD_OBJECTS)) {
                    const store = db.createObjectStore(DataBaseManager.STANDARD_OBJECTS, { keyPath: 'id', autoIncrement: false });
                    // store.createIndex('id', 'id');
                    // console.log("createObjectStore ", STANDARD_OBJECTS);
                }
                if (!db.objectStoreNames.contains(DataBaseManager.BIG_OBJECTS)) {
                    const store = db.createObjectStore(DataBaseManager.BIG_OBJECTS, { keyPath: 'id', autoIncrement: false });
                    // store.createIndex('id', 'id');
                    store.createIndex('type', 'type', { unique: false });
                    // console.log("createObjectStore ", BIG_OBJECTS);
                }
            }
        });
    }

    public async delete() {
        console.debug("#HERELINE DataBaseManager " + this.name + " delete ");
        return deleteDB(this.TABLE_NAME)
    }


}

