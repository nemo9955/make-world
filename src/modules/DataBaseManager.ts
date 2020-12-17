
import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, IDBPTransaction, IDBPObjectStore, StoreKey, StoreValue } from 'idb';


export const PLANET_SYSTEM = "planet_system"
export const TABLE_NAME = "world_table"

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

    constructor() {
        this.idb = null;
    }

    public async init() {
        await this.delete()
        await this.open()
    }

    public async open() {
        this.idb = await openDB(TABLE_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(PLANET_SYSTEM)) {
                    const store = db.createObjectStore(PLANET_SYSTEM, { keyPath: 'id', autoIncrement: false });
                    // store.createIndex('id', 'id');
                    // console.log("createObjectStore ", PLANET_SYSTEM);
                }
            }
        });
    }

    public async delete() {
        await deleteDB(TABLE_NAME)
    }


    public transaction(obj_store: string, type: IDBTransactionMode = "readonly") {
        var data = new STransaction();
        data.tx = this.idb.transaction(obj_store, type);
        data.store = data.tx.objectStore(obj_store);

        return data
    }



}

