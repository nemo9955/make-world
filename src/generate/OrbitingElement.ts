import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { Identifiable } from "../modules/DataBaseManager";
import { orbit_types_, WorldData } from "../modules/WorldData";

import type { Orbit } from "./Orbit";
import type { Planet } from "./Planet";
import type { Star } from "./Star";
import type { PlanetarySystem } from "./PlanetarySystem";


// https://stackoverflow.com/a/65337891/2948519
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html

export class OrbitingElement implements Identifiable {
    public id: number = null;
    public type: string = null;
    public depth: number = 0;
    public satelites: number[] = [];
    public parentId: number = null;


    /*
    to be set from outside by WorldData
    constructor(worldData: WorldData) {
        (this as any).__proto__.getWorldData = () => { return worldData };
    */
    public getWorldData(): WorldData { throw new Error("Function needs to be re-defined in constructor."); }

    constructor(worldData: WorldData) {
        // (this as any).__proto__.worldData = worldData;
        (this as any).__proto__.getWorldData = () => { return worldData; };
        this.id = this.getWorldData()?.getFreeID();
    }



    public copyDeep(source_: this) {
        Convert.copyDeep(this, source_)
        return this;
    }

    public copyShallow(source_: this) {
        Convert.copyShallow(this, source_)
        return this;
    }

    public copyLogic(source_: this) {
        Convert.copyShallow(this, source_, true)
        return this;
    }

    public clearSatelites() {
        for (const sat_ of this.getSats()) {
            sat_.remove();
        }
    }

    public clearNonStars() {
        for (const sat_ of this.getSats()) {
            if (sat_.type === "Star") continue;
            if (sat_.satelites.length > 0 &&
                sat_.getSatIndex(0).type === "Star") continue;
            sat_.remove();
        }
    }

    public remove() {
        var parent_obj = this.getParent();
        var dat_index_ = parent_obj.satelites.indexOf(this.id);
        parent_obj.satelites.splice(dat_index_, 1)

        this.clearSatelites();

        this.getWorldData().free(this.id);
    }

    public getSats(): OrbitingElement[] {
        var satObjs: OrbitingElement[] = []
        for (const sid of this.satelites)
            satObjs.push(this.getWorldData().stdBObjMap.get(sid))
        return satObjs
    }

    public getSatIndex(index: number): OrbitingElement {
        var sid = this.satelites[index];
        return this.getWorldData().stdBObjMap.get(sid)
    }

    // public getSatId(sid: number): OrbitingElement {
    //     return this.getWorldData().stdBObjMap.get(sid)
    // }

    public addSat(sat_: OrbitingElement) {
        sat_.depth = this.depth + 1
        sat_.parentId = this.id;
        this.satelites.push(sat_.id)
        this.getWorldData().setOrbElem(sat_)
    }


    public getParent(): this {
        return this.getWorldData().stdBObjMap.get(this.parentId)
    }

    public getParentOrbit(): Orbit {
        // get parent orbit, excluding self if an Orbit
        var parentOrbit = this.getParent();
        while (true) {
            if (!parentOrbit) return null;
            if (parentOrbit.type == "PlanetarySystem") return null;
            if (parentOrbit.type == "Orbit")
                return parentOrbit as any;
            parentOrbit = parentOrbit.getParent();
        }
    }

    public getDirectOrbit(): Orbit {
        // get first Orbit, including self if an Orbit
        var parentOrbit = this;
        while (true) {
            if (!parentOrbit) return null;
            if (parentOrbit.type == "PlanetarySystem") return null;
            if (parentOrbit.type == "Orbit")
                return parentOrbit as any;
            parentOrbit = this.getWorldData().stdBObjMap.get(parentOrbit.parentId)
        }
    }

    // public getMainOrbit(): Orbit {
    //     // ignore first orbit if a binary or similar
    //     return null;
    // }

}
