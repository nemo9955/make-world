
console.log("Start making a World!")

export namespace MakeWorld {


    var workerpool = require('workerpool');

    // create a worker pool
    var pool = workerpool.pool();

    // create a static function
    async function add() {
        console.log('arguments', arguments);
        console.log('arguments', arguments[0]);
        console.log('arguments', arguments[0].cells);
        return 555;
    }

    async function weittt() {
        console.log('arguments', arguments);
        console.log('arguments', arguments[0]);
        var lenn = arguments[0] * 1000
        await new Promise(r => setTimeout(r, lenn));
        return new Promise(function (resolve, reject) {
            resolve(lenn);
        });
    }

    async function run_test(pool) {

        // await Promise.all([pool.exec(weittt, [1]), pool.exec(weittt, [3])])

        // console.log(Promise.all([pool.exec(add, [1]), pool.exec(add, [3])]))
        // console.log(pool.exec(add, [1]))
        // console.log(typeof pool.exec(add, [1]))

        pool.exec(weittt, [2])
            .then(function (result) {
                console.log('!!!!!!!!!!!!! result ', result);
            })
            .catch(function (err) {
                console.error(err);
            })
        // .then(function () {
        //     pool.terminate(); // terminate all workers when done
        // });
    }

    var planet_data = {
        cells: Array.from(Array(10).keys())
    }

    // offload execution of a function to the worker pool

    var t0, t1;

    t0 = performance.now();

    run_test(pool)

    t1 = performance.now();
    console.log(`Call to doSomething took ${t1 - t0} milliseconds.`);


    console.log("DONE making a World!")
}
