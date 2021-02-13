
import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, IDBPTransaction, IDBPObjectStore, StoreKey, StoreValue } from 'idb';
// import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, IDBPTransaction, IDBPObjectStore, StoreKey, StoreValue } from 'idb/with-async-ittr.js';


export interface Identifiable {
    id: number;
}

export class DataBaseManager {
    public readonly name: string;
    public idb: IDBPDatabase<unknown>;

    public static STANDARD_OBJECTS = "STANDARD_OBJECTS";
    public TABLE_NAME = "world_table";

    constructor(name: string) {
        this.name = name;
        this.idb = null;
    }

    public async init() {
        console.debug("#HERELINE DataBaseManager " + this.name + " init ");
        return this.delete()
            .then(() => {
                console.debug("#HERELINE DataBaseManager " + this.name + " init then  ");
                return this.open();
            })
    }

    public async open() {
        console.debug("#HERELINE DataBaseManager " + this.name + " open ");
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
            }
        });
    }

    public async delete() {
        console.debug("#HERELINE DataBaseManager " + this.name + " delete ");
        return deleteDB(this.TABLE_NAME)
    }


}

