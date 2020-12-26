
import { openDB, deleteDB, wrap, unwrap, IDBPDatabase, IDBPTransaction, IDBPObjectStore, StoreKey, StoreValue } from 'idb';


export class STransaction {
    public tx: IDBPTransaction<unknown, [string]>;
    public store: IDBPObjectStore<unknown, [string], string>;
    constructor() { }
    public async done() {
        await this.tx.done
    }
}

export const PLANET_SYSTEM_ = "planet_system";

export class DataBaseManager {
    idb: IDBPDatabase<unknown>;

    PLANET_SYSTEM = PLANET_SYSTEM_;
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
                if (!db.objectStoreNames.contains(PLANET_SYSTEM_)) {
                    const store = db.createObjectStore(PLANET_SYSTEM_, { keyPath: 'id', autoIncrement: false });
                    // store.createIndex('id', 'id');
                    // console.log("createObjectStore ", PLANET_SYSTEM);
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

