
console.log("START test_3!")

import TheUpdateWorker from "worker-loader!./test_3.worker.upd";
import TheDrawWorker from "worker-loader!./test_3.worker.draw";

import { openDB, deleteDB, wrap, unwrap } from 'idb';
import * as THREE from "three";

import * as Stats from "stats.js";

import * as tcom from "./test_3_common";
export namespace test_3 {

    var view_size = [900, 400]

    function rand(min: number, max: number) {
        return (Math.random() * (max - min)) + min
    }

    async function make_stuff() {

        await deleteDB("test_3")
        const db = await openDB("test_3", 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('cubes')) {
                    const store = db.createObjectStore('cubes', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('id', 'id');
                    console.log("createObjectStore cubes !!!!!!!!!!!!!!!!");
                }
            }
        });

        const tx = db.transaction('cubes', 'readwrite');
        const store = tx.objectStore('cubes');

        for (let index = 0; index < 20; index++) {
            var cube_ = {
                x: rand(-10, 10),
                y: rand(-5, 5),
                z: rand(-5, 5),
                rx: 0,
                ry: 0,
                rz: 0,
            }
            await store.put(cube_);
        }
        await tx.done;



    }



    // console.log("Stats", Stats);
    // var stats = new Stats();
    // function update_fake() {
    //     requestAnimationFrame(update_fake)
    //     stats.begin();
    //     // monitored code goes here
    //     stats.end();
    // }

    export async function init() {
        // stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        // document.body.appendChild(stats.dom);
        // update_fake();

        await make_stuff();

        // debugger;

        const canvasWindow: HTMLCanvasElement = document.querySelector("#canvas-window");
        const canvasOffscreen: HTMLCanvasElement = (document.querySelector("#canvas-worker") as any).transferControlToOffscreen();
        const renderer = new THREE.WebGLRenderer({ canvas: canvasWindow });
        renderer.setSize(view_size[0], view_size[1]);
        const cube = new tcom.ThreejsCube(renderer);
        cube.animate();




        document.querySelector('#make-busy').addEventListener('click', () => {
            (document.querySelector('#busy') as any).innerText = 'Main thread working...';
            // requestAnimationFrame(() => {
            // requestAnimationFrame(() => {
                console.log("stttttttttttt");
                tcom.wait(3000);
                console.log("edddddddddddd");
                (document.querySelector('#busy') as any).innerText = 'Done!';
            // });
            // })
        });

        // const workerCode = document.querySelector('#workerCode').textContent;
        // const blob = new Blob([workerCode], { type: 'text/javascript' });
        // const url = URL.createObjectURL(blob);
        // // const worker = new Worker(url);
        // const urlParts = location.href.split('/');
        // if (urlParts[urlParts.length - 1].indexOf('.') !== -1) {
        //     urlParts.pop();
        // }

        const worker_draw: any = new TheDrawWorker();
        worker_draw.postMessage(
            {
                msg: 'start',
                view_size: view_size,
                canvas: canvasOffscreen
            }, [canvasOffscreen]
        );


        // something weird is happening with wait when the update worke is active or not
        const worker_upd: any = new TheUpdateWorker();
        worker_upd.postMessage({ msg: 'start' });



    }

}

console.log("DONE test_3!")
