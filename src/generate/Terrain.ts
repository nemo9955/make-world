
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { WorldData } from "../modules/WorldData";
import { Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";
import { PlanetarySystem } from "./PlanetarySystem";
import { Planet } from "./Planet";
import { Identifiable } from "../modules/ObjectsHacker";




export class Terrain extends Identifiable {

    public orbitElemId: number = null;
    public test: number = 100;

    // constructor(worldData: WorldData, data_: any) {
    //     super(worldData);
    // }


    constructor(worldData: WorldData) {
        super(worldData);
    }

    public getOrbitingElement(): OrbitingElement {
        if (!this.orbitElemId) return null;
        return this.getWorldData().idObjMap.get(this.orbitElemId)
    }



    public static initForPlanet(planet_: Planet) {
        console.debug(`#HERELINE Terrain initForPlanet `);
        console.log("planet_", planet_);

        var terrain = new Terrain(planet_.getWorldData());
        terrain.orbitElemId = planet_.id;
        console.log("terrain", terrain);

        terrain.getWorldData().setBigIdObject(terrain)
    }



    // public clone() { return new Terrain(this.getWorldData()).copyLogic(this) }
    public static clone(worldData: WorldData, data_: any) { return new Terrain(worldData).copyDeep(data_) }


}