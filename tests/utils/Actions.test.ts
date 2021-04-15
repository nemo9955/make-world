// import * as ActionsManager from "../../src/utils/Actions"
import { ActionsManager } from "../.././src/utils/Actions"

// https://jestjs.io/docs/en/expect



test('Basic 1', () => {
    var call_checker = []
    const actm = new ActionsManager();

    actm.addAction("ping", (data, name) => {
        call_checker.push(name + "_" + data)
    })

    actm.callAction("ping", 5)
    expect(call_checker).toMatchObject(['ping_5'])
    actm.callAction("ping", 15)
    expect(call_checker).toMatchObject(['ping_5', 'ping_15'])
    actm.callAction("ping", 10)
    expect(call_checker).toMatchObject(['ping_5', 'ping_15', 'ping_10'])
});


test('Basic 2', () => {
    var call_checker = []
    const actm = new ActionsManager();

    actm.addAction("ping", function (data, name) {
        call_checker.push(name + "_" + data)
    })

    actm.callAction("ping", 5)
    expect(call_checker).toMatchObject(['ping_5'])
    actm.callAction("ping", 15)
    expect(call_checker).toMatchObject(['ping_5', 'ping_15'])
    actm.callAction("ping", 10)
    expect(call_checker).toMatchObject(['ping_5', 'ping_15', 'ping_10'])
});



test('Basic 3', () => {
    var call_checker = []
    const actm = new ActionsManager();

    actm.addAction("ping", function (data, name) {
        call_checker.push(name + "_" + data)
    })


    jest.useFakeTimers()
    actm.callActionDelay("ping", 5)
    actm.callActionDelay("ping", 15)
    actm.callActionDelay("ping", 10)
    expect(call_checker).toMatchObject([])

    jest.runAllTimers()
    expect(call_checker).toMatchObject(['ping_5', 'ping_15', 'ping_10'])
});




// test('Basic Async 1', async () => {
//     var call_checker = []
//     const actm = new ActionsManager();

//     actm.addAction("ping", async (data, name) => {
//         console.log("name + _ + data", name + "_" + data);
//         call_checker.push(name + "_" + data)
//     })


//     return Promise.resolve().then(() => {
//         actm.callActionAsync("ping", 5)
//         actm.callActionAsync("ping", 15)
//         actm.callActionAsync("ping", 10)
//         expect(call_checker).toMatchObject([])
//     }).then(() => {
//         expect(call_checker).toMatchObject(['ping_5', 'ping_15', 'ping_10'])
//     })
// });


