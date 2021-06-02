import { Star } from "./Star";
import { Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";
import { Planet } from "./Planet";

import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { WorldData } from "../modules/WorldData";


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian

// Calendar https://quarkndagger.com/an-informative-worldbuilding-guide-to-calendar-creation/

export class PlanetarySystem extends OrbitingElement {

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
        for (const obj_ of this.getWorldData().rwDbObjs.values()) {
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
        this.getWorldData().restartTime();
        this.getWorldData().setRwObj(this)
    }


    private allElemsDepth(satObjs: OrbitingElement[], sat_: OrbitingElement): void {
        if (satObjs.includes(sat_) == false)
            satObjs.push(sat_);
        for (const chsat_ of sat_.getSats()) {
            this.allElemsDepth(satObjs, chsat_);
        }
    }

    public getAllElems(): OrbitingElement[] {
        var satObjs: OrbitingElement[] = [];
        this.allElemsDepth(satObjs, this);
        return satObjs
    }


    // public guiSelect(slectPane: Tweakpane, gui: WorldGui) {
    //     // const plsys_tp = this.mainPane.addFolder({ title: 'Planet System', expanded: false });
    //     slectPane.addInput(this.hab_zone_in, 'km', { label: "hab_zone_in" });
    //     slectPane.addInput(this.hab_zone, 'km', { label: "hab_zone" });
    //     slectPane.addInput(this.hab_zone_out, 'km', { label: "hab_zone_out" });
    //     slectPane.addInput(this.orbits_limit_in, 'km', { label: "orbits_limit_in" });
    //     slectPane.addInput(this.frost_line, 'km', { label: "frost_line" });
    //     slectPane.addInput(this.orbits_limit_out, 'km', { label: "orbits_limit_out" });
    //     super.guiSelect(slectPane, gui);
    // }




    public clone() { return new PlanetarySystem(this.getWorldData()).copyLogic(this) }
    public static clone(worldData: WorldData, data_: any) { return new PlanetarySystem(worldData).copyDeep(data_) }
    static get type() { return `PlanetarySystem` }

}