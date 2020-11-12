
console.log("START TEST 1!")

import PrimeWorker from "worker-loader!./worker.1";

// Add web worker as described in
// https://www.jameslmilner.com/post/workers-with-webpack-and-typescript/

export namespace test_1 {

    export function init() {

        const worker = new PrimeWorker();

        worker.postMessage({ limit: 1000 });
        worker.onmessage = (event) => {
            document.getElementById("primes").innerHTML = event.data.primes;
        };
    }

}

console.log("DONE TEST 1!")
