

import { PlanetarySystem } from "../generate/PlanetarySystem"
import * as Convert from "../utils/Convert"
import { WorldData } from "./WorldData";



export interface ClonableConstructor<Klass> {
    // garo master race
    // new(worldData: WorldData, data_: any): Klass
    clone(worldData: WorldData, data_: any): Klass
}


export abstract class Identifiable {
    public id: number = null;
    public type: string = null;

    /*
    to be set from outside by WorldData
    constructor(worldData: WorldData) {
        (this as any).__proto__.getWorldData = () => { return worldData };
    */
    public getWorldData(): WorldData { throw new Error("Function needs to be re-defined in constructor."); }
    public setWorldData(worldData: WorldData) {
        (this as any).__proto__.getWorldData = () => { return worldData; };
    }

    constructor(worldData: WorldData) {
        this.type = this.constructor.name;
        this.setWorldData(worldData);
        this.genId();
    }

    protected genId() {
        this.id = this.getWorldData().getFreeID();
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



    // // public clone() { return new Terrain(this.getWorldData()).copyLogic(this) }
    // public static clone(worldData: WorldData, data_: any) { return new Terrain(worldData).copyDeep(data_) }

}
