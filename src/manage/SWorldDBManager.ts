
import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, IDBPTransaction, IDBPObjectStore, StoreKey, StoreValue } from 'idb';


export const PLANET_SYSTEM = "planet_system"
export const TABLE_NAME = "world_table"

export class STransaction {
    public tx: IDBPTransaction<unknown, [string]>;
    public store: IDBPObjectStore<unknown, [string], string>;
    constructor() { }
    public done() {
        this.tx.done
    }
}

export class SWorldDBManager {
    idb: IDBPDatabase<unknown>;

    constructor() {    }

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
                    console.log("createObjectStore ", PLANET_SYSTEM);
                }
            }
        });
    }

    public async delete() {
        await deleteDB(TABLE_NAME)
    }


    public transaction(obj_store: string, type: IDBTransactionMode = "readonly") {
        var data = new STransaction();

        console.log("this.idb", this.idb);

        data.tx = this.idb.transaction(obj_store, type);
        data.store = data.tx.objectStore(obj_store);

        return data
    }



}

