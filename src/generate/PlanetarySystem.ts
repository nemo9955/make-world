import { Star } from "./Star";
import { Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";
import { Planet } from "./Planet";

import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { Identifiable } from "../modules/DataBaseManager";
import { orbit_types_, WorldData } from "../modules/WorldData";
import * as Tweakpane from "tweakpane/dist/tweakpane.js"
import { WorldGui } from "../modules/WorldGui";


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian


export class PlanetarySystem extends OrbitingElement {

    // TODO Move in WorldData when more fine read/write can be done
    public readonly time = new Convert.NumberTime();

    public readonly hab_zone = new Convert.NumberLength();
    public readonly hab_zone_in = new Convert.NumberLength();
    public readonly hab_zone_out = new Convert.NumberLength();
    public readonly frost_line = new Convert.NumberLength();
    public readonly orbits_limit_in = new Convert.NumberLength();
    public readonly orbits_limit_out = new Convert.NumberLength();

    constructor(worldData: WorldData) {
        super(worldData);
        this.type = this.constructor.name;
    }

    public getStars(): Star[] {
        var starObjs: Star[] = []
        for (const obj_ of this.getWorldData().stdBObjMap.values()) {
            if (obj_.type == "Star")
                starObjs.push(obj_)
        }
        return starObjs
    }

    protected genId() {
        this.id = -1;
    }

    init() {
        this.id = this.getWorldData().getFreeID(); // gen again after WorldData sets getFreeID
        this.time.eby = 5; // start at 5 Billion Earth years
        this.getWorldData().setOrbElem(this)
    }




    public guiSelect(slectPane: Tweakpane, gui: WorldGui) {
        // const plsys_tp = this.mainPane.addFolder({ title: 'Planet System', expanded: false });
        slectPane.addInput(this.hab_zone_in, 'km', { label: "hab_zone_in" });
        slectPane.addInput(this.hab_zone, 'km', { label: "hab_zone" });
        slectPane.addInput(this.hab_zone_out, 'km', { label: "hab_zone_out" });
        slectPane.addInput(this.orbits_limit_in, 'km', { label: "orbits_limit_in" });
        slectPane.addInput(this.frost_line, 'km', { label: "frost_line" });
        slectPane.addInput(this.orbits_limit_out, 'km', { label: "orbits_limit_out" });
        super.guiSelect(slectPane, gui);
    }






}