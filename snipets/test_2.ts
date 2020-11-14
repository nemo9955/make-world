
console.log("START test_2!")

import DrawWorker from "worker-loader!./test_2.worker";
import * as THREE from "three";


// https://github.com/devnook/OffscreenCanvasDemo/blob/master/use-with-lib.html

export namespace test_2 {

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


    export async function init() {

        const canvasWindow: HTMLCanvasElement = document.querySelector("#canvas-window");
        const canvasOffscreen: HTMLCanvasElement = (document.querySelector("#canvas-worker") as any).transferControlToOffscreen();
        const renderer = new THREE.WebGLRenderer({ canvas: canvasWindow });
        renderer.setSize(400, 200);
        const cube = new ThreejsCube(renderer);
        cube.animate();





        // const workerCode = document.querySelector('#workerCode').textContent;
        // const blob = new Blob([workerCode], { type: 'text/javascript' });
        // const url = URL.createObjectURL(blob);
        // // const worker = new Worker(url);
        // const urlParts = location.href.split('/');
        // if (urlParts[urlParts.length - 1].indexOf('.') !== -1) {
        //     urlParts.pop();
        // }

        const worker_2 : any = new DrawWorker();
        worker_2.postMessage(
            {
                msg: 'start',
                canvas: canvasOffscreen
            }, [canvasOffscreen]
        );


        // origin: urlParts.join('/'),
        // URL.revokeObjectURL(url); // cleanup

    }

}

console.log("DONE test_2!")
