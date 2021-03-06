
import { WorldData } from "./WorldData"


import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as d3 from "d3"

import { Config } from "./Config"
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"



export class UpdateWorld {

    world: WorldData;
    config: Config;

    constructor() {
        this.config = null;
        this.world = null;
    }

    public update() {
        // console.debug("#HERELINE UpdateWorld update ", this.world.planetary_system.time.ey);
        this.world.planetarySystem.time.ey +=  this.config.timeUpdSpeed;
        // console.log("this.world.planetary_system.time.ey", this.world.planetary_system.time.ey);
    }

}