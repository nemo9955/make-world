import { Star } from "./Star";
import { Orbit, OrbitingElement } from "./Orbit";
import { Planet } from "./Planet";

import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian



export class PlanetarySystem implements OrbitingElement {
    id: number = null;
    type: string;
    // star: Star;


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

    private stars = new Array<Star>();

    constructor() {
        // this.star = new Star();
        this.orbit = Orbit.new();
        this.type = this.constructor.name;
    }


    init() {
        this.id = Math.ceil(Math.random() * 10000) + 1000
    }

    public copyDeep(source_: any) {
        this.clearSatelites()
        Convert.copyDeep(this, source_)

        // TODO TMP dirty way to populate stars until proper ID refs are in
        this.stars.length = 0
        for (const star_src_ of source_.stars) {
            for (const star_inst_ of this.satelites) {
                if (star_inst_ instanceof Star)
                    if (star_inst_.id === star_src_.id)
                        this.stars.push(star_inst_)
            }
        }


        return this;
    }

    public copyShallow(source_: any) {
        Convert.copyShallow(this, source_)
        return this;
    }





    public clearSatelites() {
        this.stars.length = 0;
        this.orbit.clearSatelites();
    }
    public addSat(sat_: OrbitingElement) {
        this.orbit.addSat(sat_);
        if (sat_ instanceof Star)
            this.stars.push(sat_)
    }

    public free(): void { return; }
    public getStars(): Star[] {
        return this.stars
    }


}