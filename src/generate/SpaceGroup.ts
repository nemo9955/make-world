
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { Identifiable } from "../modules/DataBaseManager";
import { orbit_types_, WorldData } from "../modules/WorldData";
import { OrbitingElement } from "./OrbitingElement";


import type { Orbit } from "./Orbit";
import type { Planet } from "./Planet";
import type { Star } from "./Star";
import type { PlanetarySystem } from "./PlanetarySystem";
// import type { SpaceGroup } from "./SpaceGroup";


/*
    Used to Logically group a number of orbital elements as one
    Binary Planets/Stars as one for example
*/
export class SpaceGroup extends OrbitingElement {

    public combineChildrenMass = true;
    private tmp_mass = new Convert.NumberMass();

    constructor(worldData: WorldData) {
        super(worldData);
        this.type = this.constructor.name;

    }


    public getMass(): Convert.NumberMass {
        if (this.combineChildrenMass == false) return null;
        this.tmp_mass.value = 0;
        for (const sat_ of this.getAllSats()) {
            if (sat_.getMass() === null) continue;
            this.tmp_mass.value += sat_.getMass().value;
        }
        return this.tmp_mass;
    }

    public clone() { return new SpaceGroup(this.getWorldData()).copyLogic(this) }

}