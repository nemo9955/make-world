
import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, IDBPTransaction, IDBPObjectStore, StoreKey, StoreValue } from 'idb';


export interface Identifiable {
    id: number;
}

export class STransaction {
    public tx: IDBPTransaction<unknown, [string]>;
    public store: IDBPObjectStore<unknown, [string], string>;
    constructor() { }
    public async done() {
        await this.tx.done
    }
}

export class DataBaseManager {
    idb: IDBPDatabase<unknown>;

    public static STANDARD_OBJECTS = "STANDARD_OBJECTS";
    public TABLE_NAME = "world_table";

    constructor() {
        this.idb = null;
    }

    public async init() {
        await this.delete()
        await this.open()
    }

    public async open() {
        this.idb = await openDB(this.TABLE_NAME, 1, {
            upgrade(db) {
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
        await deleteDB(this.TABLE_NAME)
    }


    public transaction(obj_store: string, type: IDBTransactionMode = "readonly") {
        var data = new STransaction();
        // console.log("this.idb", this.idb);
        // console.log("this.idb.transaction", this.idb.transaction);
        data.tx = this.idb.transaction(obj_store, type);
        data.store = data.tx.objectStore(obj_store);
        // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

        return data
    }



}

