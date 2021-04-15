const ctx: Worker = self as any;

// import { MakeWorld } from "../src/main/MakeWorld"


import { openDB, deleteDB, wrap, unwrap } from 'idb';


function init() {

}

ctx.addEventListener("message", async (event) => {

    // const db = await openDB("test_1", 1);

    // console.log("db.objectStoreNames.contains('primes')", db.objectStoreNames.contains('primes'));

    // const tx = db.transaction('primes', 'readwrite');
    // const store = tx.objectStore('primes');
    // // const val = (await store.get('counter')) || 0;

    // primes.forEach(async prime => {
    //     // console.log("prime", prime);
    //     // store.put({value: prime});
    //     await store.put({ value: prime });
    //     // store.put(prime);
    //     // await store.put(prime, "id");
    //     // db.put("primes", prime, prime)
    // });
    // await tx.done;

    // ctx.postMessage({ primes });
});