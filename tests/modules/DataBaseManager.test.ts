// import * as DataBaseManager from "../.././src/modules/DataBaseManager"
import { DataBaseManager } from "../.././src/modules/DataBaseManager"

// https://jestjs.io/docs/en/expect


// import indexedDB from 'fake-indexeddb';

require("fake-indexeddb/auto");

console.debug = jest.fn() // supress debugg logs
console.time = jest.fn()

test('Basic 1', async () => {
    var dbm = new DataBaseManager("test_db_mng");
    dbm.TABLE_NAME = "world_table_dbm_basic_1"

    return dbm.init().then(async () => {
        // console.log("dbm.idb", dbm.idb);
    }).then(async () => {
        // console.log("dbm.TABLE_NAME", dbm.TABLE_NAME);
    })
});


