
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

    update() {
    }

}