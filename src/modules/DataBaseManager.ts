
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
    public static KEYVAL_OBJECTS = "keyval";
    public tableName: string = null;

    constructor(targetTable: string, name: string) {
        this.name = name;
        this.tableName = targetTable;
        this.idb = null;
    }

    public async init(keepDb: boolean) {
        console.log(`#HERELINE DataBaseManager ${this.name} init : ${this.tableName} `);

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
        this.idb = await openDB(this.tableName, 1, {
            upgrade(db) {
                console.debug("#HERELINE DataBaseManager NOTHEN open upgrade ");
                // this.idb = db;
                // TODO, make generic container with ID-able objects
                if (!db.objectStoreNames.contains(DataBaseManager.STANDARD_OBJECTS)) {
                    const store = db.createObjectStore(DataBaseManager.STANDARD_OBJECTS, { keyPath: 'id', autoIncrement: false });
                    store.createIndex('type', 'type', { unique: false });
                    // store.createIndex('id', 'id');
                    // console.log("createObjectStore ", STANDARD_OBJECTS);
                }
                if (!db.objectStoreNames.contains(DataBaseManager.KEYVAL_OBJECTS)) {
                    const store = db.createObjectStore(DataBaseManager.KEYVAL_OBJECTS);
                }
            }
        });
    }

    public async delete() {
        console.debug("#HERELINE DataBaseManager " + this.name + " delete ");
        return deleteDB(this.tableName)
    }


    public async getKv(key: any) { return await this.idb.get('keyval', key); }
    public setKv(key: any, val: any) { return this.idb.put('keyval', val, key); }
    public delKv(key: any) { return this.idb.delete('keyval', key); }
    public clearKv() { return this.idb.clear('keyval'); }
    public keysKv() { return this.idb.getAllKeys('keyval'); }

}

