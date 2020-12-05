
console.log("START test_4 !")

// import TheWorker from "worker-loader!./test_4.worker";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export namespace test_4 {

    var scene: THREE.Scene;
    var camera: THREE.PerspectiveCamera;
    var renderer: THREE.WebGLRenderer;
    var geometry: THREE.Geometry;
    var material: THREE.Material;
    var controls: OrbitControls;

    var stime = 0
    var radius = 4


    var sun: THREE.Object3D;
    var earth: THREE.Object3D;

    var curve: THREE.EllipseCurve;
    var ellipse: THREE.Object3D;


    export async function init() {

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.y = 10;
        // camera.position.z = 10;
        camera.lookAt(0, 0, 0)


        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);


        sun = new THREE.Mesh(
            new THREE.SphereGeometry(1, 5, 5),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0.6, 0.6, 0.0) })
        );
        sun.position.set(0, 0, 0);
        scene.add(sun);

        earth = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 5, 5),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0.0, 0.6, 0.0) })
        );
        earth.position.set(0, 0, 5);
        scene.add(earth);

        controls = new OrbitControls(camera, renderer.domElement);

        var ambcolo = 0.2
        const light_am = new THREE.AmbientLight(new THREE.Color(ambcolo, ambcolo, ambcolo)); // soft white light
        scene.add(light_am);

        var ptlicolo = 0.1
        const light_pt = new THREE.PointLight(new THREE.Color(ptlicolo, ptlicolo, ptlicolo), 10, 800);
        var ptltpos = 50;
        light_pt.position.set(-ptltpos, ptltpos, ptltpos);
        scene.add(light_pt);


        // raycaster = new THREE.Raycaster();


        curve = new THREE.EllipseCurve(
            0, 0,            // ax, aY
            4, 5,           // xRadius, yRadius
            0, 2 * Math.PI,  // aStartAngle, aEndAngle
            false,            // aClockwise
            0                 // aRotation
        );
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        // Create the final object to add to the scene
        ellipse = new THREE.Line(geometry, material);
        ellipse.rotateX(90)
        scene.add(ellipse);


        animate();

    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

        stime += 0.1;


        earth.position.x = radius * Math.sin(THREE.MathUtils.degToRad(stime));
        earth.position.z = radius * Math.cos(THREE.MathUtils.degToRad(stime));

        sun.rotation.y += 0.03;
        earth.rotation.y -= 0.02;

        renderer.render(scene, camera);
    }

}

console.log("DONE test_4!")
