import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { WorldData } from "../modules/WorldData";

import type { Orbit } from "./Orbit";
import type { Planet } from "./Planet";
import type { Star } from "./Star";
import type { PlanetarySystem } from "./PlanetarySystem";
import type { SpaceGroup } from "./SpaceGroup";
import { Identifiable } from "../modules/ObjectsHacker";
import { JguiMake, JguiManager } from "../gui/JguiMake";
import { jguiData } from "../gui/JguiUtils";


// https://stackoverflow.com/a/65337891/2948519
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html

export class OrbitingElement extends Identifiable {
    // public id: number = null;
    // public type: string = null;
    public depth: number = 0;
    public satelites: number[] = [];
    public parentId: number = null;

    public isInHabZone = false;



    constructor(worldData: WorldData) {
        super(worldData);
    }


    public clearSatelites() {
        for (const sat_ of this.getSats()) {
            sat_.remove();
        }
    }

    public root(): OrbitingElement {
        if (this.satelites.length == 1)
            return this.getSatIndex(0);
        return null;
    }



    public getParents(): OrbitingElement[] {
        var parents: OrbitingElement[] = []
        // get parent orbit, excluding self if an Orbit
        var lastParent = this.getParent();
        while (true) {
            if (!lastParent) break;
            parents.push(lastParent)
            lastParent = lastParent.getParent();
        }
        return parents;
    }


    public getAllSats(): OrbitingElement[] {
        var satObjs = this.getSats();
        var stillLooking = true;

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

    public getAllOrbits(): Orbit[] {
        var orbitObjs: Orbit[] = [];
        for (const sat_ of this.getAllSats()) {
            if (sat_.type === "Orbit")
                orbitObjs.push(sat_ as Orbit)
        }
        return orbitObjs
    }

    public hasStar(): boolean {
        if (this.type === "Star") return true;
        for (const sat_ of this.getSats()) {
            if (sat_.type === "Star") return true;
            if (sat_.hasStar()) return true;
        }
        return false
    }


    public clearNonStars() {
        for (const sat_ of this.getSats()) {
            if (sat_.hasStar()) continue;
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
            satObjs.push(this.getWorldData().idObjMap.get(sid))
        return satObjs
    }

    public getSatIndex(index: number): OrbitingElement {
        var sid = this.satelites[index];
        return this.getWorldData().idObjMap.get(sid)
    }

    // public getSatId(sid: number): OrbitingElement {
    //     return this.getWorldData().idObjMap.get(sid)
    // }

    public addSat(sat_: OrbitingElement) {
        sat_.isInHabZone = this.isInHabZone; // not reliable here
        sat_.depth = this.depth + 1;
        sat_.parentId = this.id;
        this.satelites.push(sat_.id)
        this.getWorldData().setIdObject(sat_)
    }

    // public setOrbiting(sat_: OrbitingElement) {
    //     this.orbitingId = sat_.id;
    // }
    // public getOrbiting(): OrbitingElement {
    //     if (this.orbitingId)
    //         return this.getWorldData().idObjMap.get(this.orbitingId)
    //     return this.getParentSolid();
    // }

    public getMass(): Convert.NumberBigMass {
        // By default, there is no mass !!!
        return null;
    }

    public getParentMass(): Convert.NumberBigMass {
        // get parent orbit, excluding self if an Orbit
        var parent_: OrbitingElement = this.getParent();
        while (true) {
            if (!parent_) return null;
            if (parent_.getMass() != null && parent_.getMass()) return parent_.getMass();
            parent_ = parent_.getParent();
        }
    }

    public compute() {
        const parents = this.getParents();
        this.depth = parents.length;
        for (const par_ of parents)
            if (par_.isInHabZone) this.isInHabZone = true;

    }

    public computeAll() {
        for (const sat_ of this.getAllSats()) {
            sat_.compute();
        }
    }

    public getParent(): OrbitingElement {
        return this.getWorldData().idObjMap.get(this.parentId)
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
            parentOrbit = this.getWorldData().idObjMap.get(parentOrbit.parentId)
        }
    }


    // protected guiPopSelectChildren(slectPane: Tweakpane, gui: WorldGui, generalAct: Tweakpane.FolderApi) {
    //     this.getSats().forEach((sat_, index) => {
    //         var title = `${sat_.type} ${sat_.id}`
    //         generalAct.addButton({ title: title }).on('click', () => {
    //             gui.selectOrbElement(sat_);
    //         });
    //     });
    // }


    // public guiSelect(slectPane: Tweakpane, gui: WorldGui) {
    //     console.debug("#HERELINE OrbitingElement populateSelectGUI ");
    //     slectPane.addMonitor(this, "id", { index: 2 });
    //     slectPane.addMonitor(this, "type", { index: 3 });
    //     slectPane.addMonitor(this, "depth", { index: 4 });

    //     const generalAct = slectPane.addFolder({ title: 'Select', expanded: true, index: 10000 });
    //     var parent = this.getParent();
    //     if (parent)
    //         generalAct.addButton({ title: `Parent ${parent.type} ${parent.id}` }).on('click', () => {
    //             gui.selectOrbElement(parent);
    //         });
    //     this.guiPopSelectChildren(slectPane, gui, generalAct)
    // }

    public addToJgui(jData: jguiData) {
        jData.jgui.addLabel(`id : ${this.id}`);
        jData.jgui.addLabel(`type : ${this.type}`);
        jData.jgui.addLabel(`depth : ${this.depth}`);
    }




}
