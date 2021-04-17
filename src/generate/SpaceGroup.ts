
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { WorldData } from "../modules/WorldData";
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
    private tmp_mass = new Convert.NumberBigMass();
    public groupedSatelites: number[] = [];

    constructor(worldData: WorldData) {
        super(worldData);
        this.type = this.constructor.name;

    }

    public addToSpaceGroup(sat_: OrbitingElement) {
        this.groupedSatelites.push(sat_.id)
        this.addSat(sat_)
    }

    public getAllGroupedSats(): OrbitingElement[] {
        var satObjs: OrbitingElement[] = [];
        var stillLooking = true;

        for (const sid of this.groupedSatelites)
            satObjs.push(this.getWorldData().idObjMap.get(sid))

        while (stillLooking) {
            stillLooking = false;
            for (const sat_ of satObjs) {
                for (const chsat_ of sat_.getSats()) {
                    if (satObjs.includes(chsat_) == false) {
                        stillLooking = true;
                        satObjs.push(chsat_)
                    }
                }
            }
        }
        return satObjs
    }

    public getMass(): Convert.NumberBigMass {
        if (this.combineChildrenMass == false) return null;
        this.tmp_mass.value = 0;
        for (const sat_ of this.getAllGroupedSats()) {
            if (sat_.getMass() === null) continue;
            this.tmp_mass.value += sat_.getMass().value;
        }
        return this.tmp_mass;
    }

    public clone() { return new SpaceGroup(this.getWorldData()).copyLogic(this) }

    // protected guiPopSelectChildren(slectPane: Tweakpane, gui: WorldGui, generalAct: Tweakpane.FolderApi) {
    //     this.getSats().forEach((sat_, index) => {
    //         var title = ` ${sat_.type} ${sat_.id}`
    //         if (this.groupedSatelites.includes(sat_.id))
    //             title += ` (gr ${this.id})`
    //         generalAct.addButton({ title: title }).on('click', () => {
    //             gui.selectOrbElement(sat_);
    //         });
    //     });
    // }


}