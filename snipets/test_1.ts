
console.log("START test_1!")

import PrimeWorker from "worker-loader!./test_1.worker";
import { openDB, deleteDB, wrap, unwrap } from 'idb';

// Add web worker as described in
// https://www.jameslmilner.com/post/workers-with-webpack-and-typescript/

export namespace test_1 {

    export async function init() {

        const worker = new PrimeWorker();

        await deleteDB("test_1")

        const db = await openDB("test_1", 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('primes')) {
                    const store = db.createObjectStore('primes', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('id', 'id');
                    console.log("createObjectStore primes !!!!!!!!!!!!!!!!");
                }
            }
        });
        // var objectStore = db.createObjectStore('toDoList', { keyPath: 'taskTitle' });

        worker.postMessage({ limit: 100 });
        worker.onmessage = async (event) => {
            document.getElementById("primes").innerHTML = event.data.primes;
            // event.data.primes.forEach(prime => {
            //     console.log("prime", prime);
            // });
            console.log(await db.getAllFromIndex('primes', 'id'));

        };



        // async function doDatabaseStuff() {
        // const db = await openDB("test_1");
        // }


    }

}

console.log("DONE test_1!")
