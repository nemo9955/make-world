
// import { MakeWorld } from "../src/main/MakeWorld"


import { openDB, deleteDB, wrap, unwrap } from 'idb';

export namespace test_1 {
    const ctx: Worker = self as any;

    class SieveOfEratosthenes {

        calculate(limit: number) {

            console.log("calc start")
            // MakeWorld.init()

            const sieve = [];
            const primes: number[] = [];
            let k;
            let l;

            sieve[1] = false;
            for (k = 2; k <= limit; k += 1) {
                sieve[k] = true;
            }

            for (k = 2; k * k <= limit; k += 1) {
                if (sieve[k] !== true) {
                    continue;
                }
                for (l = k * k; l <= limit; l += k) {
                    sieve[l] = false;
                }
            }

            sieve.forEach(function (value, key) {
                if (value) {
                    this.push(key);
                }
            }, primes);


            console.log("calc done")

            return primes;

        }

    }

    const sieve = new SieveOfEratosthenes();


    ctx.addEventListener("message", async (event) => {
        const limit = event.data.limit;
        const primes = sieve.calculate(limit);

        const db = await openDB("test_1", 1);

        console.log("db.objectStoreNames.contains('primes')", db.objectStoreNames.contains('primes'));

        const tx = db.transaction('primes', 'readwrite');
        const store = tx.objectStore('primes');
        // const val = (await store.get('counter')) || 0;

        primes.forEach(async prime => {
            // console.log("prime", prime);
            // store.put({value: prime});
            await store.put({ value: prime });
            // store.put(prime);
            // await store.put(prime, "id");
            // db.put("primes", prime, prime)
        });
        await tx.done;

        ctx.postMessage({ primes });
    });

}