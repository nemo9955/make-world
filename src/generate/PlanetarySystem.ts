import { Star } from "./Star";
import { Orbit, OrbitingElement } from "./Orbit";
import { Planet } from "./Planet";

import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { Identifiable } from "../modules/DataBaseManager";
import { WorldData } from "../modules/WorldData";


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian


export class PlanetarySystem implements OrbitingElement, Identifiable {
    id: number = null;
    type: string = null;
    // star: Star;

    // public getWorldData: () => WorldData; // to be set from outside by WorldData
    // public get worldData() { return this.getWorldData(); } // avoid having an instance for the DB
    public get worldData() { return WorldData.instance; } // avoid having an instance for the DB

    public orbit: Orbit;
    public get mean_longitude() { return this.orbit.mean_longitude; }
    public get longitude_ascending_node() { return this.orbit.longitude_ascending_node; }
    public get argument_of_perihelion() { return this.orbit.argument_of_perihelion; }
    public get inclination() { return this.orbit.inclination; }
    public get semimajor_axis() { return this.orbit.semimajor_axis; }
    public get semiminor_axis() { return this.orbit.semiminor_axis; }
    public get focal_distance() { return this.orbit.focal_distance; }
    public get satelites() { return this.orbit.satelites; }
    public get eccentricity() { return this.orbit.eccentricity; }


    // TODO Move in WorldData when more fine read/write can be done
    public readonly time = new Convert.NumberTime();

    public readonly hab_zone = new Convert.NumberLength();
    public readonly hab_zone_in = new Convert.NumberLength();
    public readonly hab_zone_out = new Convert.NumberLength();
    public readonly frost_line = new Convert.NumberLength();
    public readonly orbits_limit_in = new Convert.NumberLength();
    public readonly orbits_limit_out = new Convert.NumberLength();

    // TODO store as IDs
    private stars = new Array<number>();

    constructor() {
        // this.star = new Star();
        this.type = this.constructor.name;
        this.orbit = Orbit.new();
    }


    init() {
        this.id = WorldData?.instance?.getFreeID();
    }

    public copyDeep(source_: any) {
        Convert.copyDeep(this, source_)
        return this;
    }

    public copyShallow(source_: any) {
        Convert.copyShallow(this, source_)
        return this;
    }

    public copyLogic(source_: this) {
        Convert.copyShallow(this, source_, true)
        return this;
    }



    public getSats(): OrbitingElement[] {
        var satObjs: OrbitingElement[] = []
        for (const sid of this.satelites)
            satObjs.push(WorldData.instance.stdBObjMap.get(sid))
        return satObjs
    }


    public clearSatelites() {
        this.stars.length = 0;
        this.orbit.clearSatelites();
    }
    public addSat(sat_: OrbitingElement) {
        this.orbit.addSat(sat_);
        if (sat_ instanceof Star)
            this.stars.push(sat_.id)
    }

    public free(): void { return; }
    public getStars(): Star[] {
        var starObjs: Star[] = []
        for (const sid of this.satelites) {
            var obj_ = WorldData.instance.stdBObjMap.get(sid)
            if (obj_ instanceof Star)
                starObjs.push(obj_)
        }
        return starObjs
    }

}