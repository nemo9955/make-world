
import { WorldData } from "./WorldData"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { Config } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { Terrain } from "../generate/Terrain";


export class UpdateWorld {


    world: WorldData;
    config: Config;

    constructor() {
        this.config = null;
        this.world = null;
    }

    public update() {
        // console.debug("#HERELINE UpdateWorld update ", this.world.planetary_system.time.ey);
        this.world.planetarySystem.time.ey += this.config.timeUpdSpeed;
        // console.log("this.world.planetary_system.time.ey", this.world.planetary_system.time.ey);

        this.updateTerrain();
    }


    updTerrCnt = 0;
    public async updateTerrain() {
        // if (this.updTerrCnt++ % 50 != 0) return;
        if (this.updTerrCnt++ != 0) return;

        for await (const iterator of this.world.iterateAllBigType(Terrain, "readwrite")) {
            console.log("iterator11111111", iterator);
            iterator.test += 10;
        }


    }

}