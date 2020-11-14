

import * as THREE from "three";

// import * as test_s2 from "./test_2"

export namespace test_2 {
    const ctx: Worker = self as any;
    console.log("ctx", ctx);

    export class ThreejsCube {
        renderer: any;
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
        boundAnimate: any;

        constructor(renderer: any) {
            this.renderer = renderer;
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, 400 / 200, 0.1, 1000);
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            this.cube = new THREE.Mesh(geometry, material);
            this.scene.add(this.cube);
            this.camera.position.z = 5;

            this.boundAnimate = this.animate.bind(this);
        }

        animate() {
            requestAnimationFrame(this.boundAnimate);
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
            this.renderer.render(this.scene, this.camera);
        }
    }


    export function init() {

    }

    let cube = null;

    ctx.addEventListener("message", async (e) => {

        console.log("e", e);

        switch (e.data.msg) {
            case 'start':
              if (!cube) {
                // importScripts('https://cdnjs.cloudflare.com/ajax/libs/three.js/94/three.min.js');
                // importScripts(e.data.origin + '/threejs-cube.js');
                e.data.canvas.style = { width: 0, height: 0 }
                const renderer = new THREE.WebGLRenderer({ canvas: e.data.canvas });
                renderer.setSize(400, 200);
                cube = new ThreejsCube(renderer);
              }
              cube.animate();
              break;
          }

    });

}