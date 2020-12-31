// import * as WorldData from "../.././src/modules/WorldData"
import { WorldData } from "../.././src/modules/WorldData"
import { DataBaseManager } from "../.././src/modules/DataBaseManager"

// https://jestjs.io/docs/en/expect

console.debug = jest.fn() // supress debugg logs
console.time = jest.fn()

require("fake-indexeddb/auto");

function make_world_test(db_name: string) {
    var wdata = new WorldData("make_world_test-" + db_name)
    var dbm = new DataBaseManager();
    wdata.dbm = dbm
    wdata.dbm.TABLE_NAME = db_name
    return wdata
}

test('Clone 1', async () => {
    var wdata_orig = make_world_test("world_table_wd_clone_1");
    var wdata_copy = make_world_test("world_table_wd_clone_1");

    return wdata_orig.dbm.init().then(() => {
        wdata_orig.init()
        wdata_copy.id = wdata_orig.id
        // console.log("wdata_orig.id, wdata_copy.id", wdata_orig.id, wdata_copy.id);
    }).then(() => {
        // console.log("wdata_orig.dbm.idb", wdata_orig.dbm.idb);
        return wdata_orig.write()
    }).then(() => {
        return wdata_copy.dbm.open()
    }).then(() => {
        return wdata_copy.read()
    }).then(() => {

        expect(wdata_copy).toMatchObject(wdata_orig)
        expect(wdata_orig).toMatchObject(wdata_copy)
        expect(wdata_copy.id).toBe(wdata_orig.id)

        return Promise.resolve()
    }).then(() => {
        wdata_copy.planetary_system.star.mass.kg = -500

        expect(wdata_copy).not.toMatchObject(wdata_orig)
        expect(wdata_orig).not.toMatchObject(wdata_copy)
        expect(wdata_copy.id).toBe(wdata_orig.id)

        return Promise.resolve()
    }).then(() => {
        // console.log("wdata_orig.id, wdata_copy.id", wdata_orig.id, wdata_copy.id);
        return Promise.resolve()
    })
});

