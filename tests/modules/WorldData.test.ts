// import * as WorldData from "../.././src/modules/WorldData"
import { WorldData } from "../.././src/modules/WorldData"
import { DataBaseManager } from "../.././src/modules/DataBaseManager"

// https://jestjs.io/docs/en/expect

console.debug = jest.fn() // supress debugg logs
console.time = jest.fn()

require("fake-indexeddb/auto");

function make_world_test(db_name: string) {
    var wdata = new WorldData("make_world_test-" + db_name)
    return wdata
}

test('Clone 1', async () => {
    // TODO FIXME this is awkward because there are 2 instances in the same scope
    var wdata_copy = make_world_test("world_table_wd_clone_2");
    var wdata_orig = make_world_test("world_table_wd_clone_1");

    // TODO FIXME this will fail because __proto__ is just like using static ....
    // and idObjMap used will switch between  wdata_copy and wdata_orig
    // return wdata_orig.init().then(() => {
    //     wdata_copy.planetary_system.id = wdata_orig.planetary_system.id
    //     // console.log("wdata_orig.id, wdata_copy.id", wdata_orig.id, wdata_copy.id);
    // }).then(() => {
    //     // console.log("wdata_orig.dbm.idb", wdata_orig.dbm.idb);
    //     return wdata_orig.writeDeep()
    // }).then(() => {
    //     return wdata_copy.dbm.open()
    // }).then(() => {
    //     return wdata_copy.readDeep()
    // }).then(() => {

    //     expect(wdata_copy).toMatchObject(wdata_orig)
    //     expect(wdata_orig).toMatchObject(wdata_copy)
    //     expect(wdata_copy.planetary_system.id).toBe(wdata_orig.planetary_system.id)

    //     return Promise.resolve()
    // }).then(() => {
    //     wdata_copy.planetary_system.getStars()[0].mass.kg = -500

    //     expect(wdata_copy).not.toMatchObject(wdata_orig)
    //     expect(wdata_orig).not.toMatchObject(wdata_copy)
    //     expect(wdata_copy.planetary_system.id).toBe(wdata_orig.planetary_system.id)

    //     return Promise.resolve()
    // }).then(() => {
    //     // console.log("wdata_orig.id, wdata_copy.id", wdata_orig.id, wdata_copy.id);
    //     return Promise.resolve()
    // })
});

