import { WorkerDOM } from "../utils/WorkerDOM";
import { Config, WorkerEvent } from "../modules/Config";
import { DrawWorkerInstance } from "../modules/GenWorkerMetadata";
import { WorldData } from "../modules/WorldData";
import { freeFloat32Array, getFloat32Array, ObjectPool } from "../utils/ObjectPool";

import * as Convert from "../utils/Convert"

import * as THREE from "three"; // node_modules/three/build/three.js
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Terrain } from "../planet/Terrain";
import { JguiMake, JguiManager } from "../gui/JguiMake";
import { jguiData } from "../gui/JguiUtils";
import { path } from "d3";
import { Object3D } from "three";



export class BuildingDrawThree implements DrawWorkerInstance {
    type: string;
    world: WorldData;
    canvasOffscreen: OffscreenCanvas;
    config: Config;
    fakeDOM: WorkerDOM;
    init(event: WorkerEvent): void {
        throw new Error("Method not implemented.");
    }
    updateShallow(): void {
        throw new Error("Method not implemented.");
    }
    updateDeep(): void {
        throw new Error("Method not implemented.");
    }
    draw(): void {
        throw new Error("Method not implemented.");
    }
    addJgui(jData: jguiData): void {
        throw new Error("Method not implemented.");
    }


}