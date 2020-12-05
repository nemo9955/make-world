const ctx: Worker = self as any;

// import { MakeWorld } from "../src/main/MakeWorld"


import { openDB, deleteDB, wrap, unwrap } from 'idb';
import * as tcom from "./test_3_common";
import * as THREE from "three";


// import * as Stats from "stats.js";
// console.log("Stats", Stats);
// var stats_ = new Stats();
// // stats_.showPanel( 2 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// stats_.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild( stats_.dom );


// let stats_ = null ;

let db = null;

async function update_me() {
    // requestAnimationFrame(update_me)
    setTimeout(() => { update_me }, 10);

    // const db = await openDB("test_3", 1)

    // const tx = db.transaction('cubes', 'readwrite');
    // const index = tx.store.index('cubes');

    // for await (const cursor of tx.store.openCursor()) {
    //     console.log(cursor.value);
    //     // Skip the next item
    //     // cursor.advance(1);
    //   }


    let cursor = await db.transaction('cubes', 'readwrite').store.openCursor();

    while (cursor) {
        //   console.log(cursor.key, cursor.value);
        const cube_ = { ...cursor.value };

        // cube_.rx += 0.01
        cube_.ry += 0.01
        // cube_.rz += 0.01

        cursor.update(cube_);
        cursor = await cursor.continue();
    }



    // for await (const cursor of index.iterate(new Date('2019-01-01'))) {
    //     const article = { ...cursor.value };
    //     article.body += ' And, happy new year!';
    //     cursor.update(article);
    // }

    // await tx.done;


}



ctx.addEventListener("message", async (e) => {

    console.log("e update : ", e);

    db = await openDB("test_3", 1)
    update_me()
    // stats_  = e.data.stats
});