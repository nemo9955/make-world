const ctx: Worker = self as any;

// import { MakeWorld } from "../src/main/MakeWorld"


import { openDB, deleteDB, wrap, unwrap } from 'idb';
import * as tcom from "./test_3_common";
import * as THREE from "three";

let cube = null;

ctx.addEventListener("message", async (e) => {

    console.log("e draw : ", e);

    switch (e.data.msg) {
        case 'start':
            if (!cube) {
                // importScripts('https://cdnjs.cloudflare.com/ajax/libs/three.js/94/three.min.js');
                // importScripts(e.data.origin + '/threejs-cube.js');
                e.data.canvas.style = { width: 0, height: 0 }
                const renderer = new THREE.WebGLRenderer({ canvas: e.data.canvas });
                renderer.setSize(e.data.view_size[0], e.data.view_size[1]);
                cube = new tcom.ThreejsCube(renderer);
            }
            cube.animate();
            break;
    }

});