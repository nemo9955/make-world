import { Star } from "./Star";
import { Orbit } from "./Orbit";
import { Planet } from "./Planet";

import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian


export function getOrbInstance(source_: any) {
    // console.log("source_", source_);
    switch (source_.type) {
        case "Orbit":
            return Orbit.new().copy(source_);
        case "Planet":
            return Planet.new().copy(source_);
        case "Star":
            return Star.new().copy(source_);
        default:
            throw new Error("NOT CONVERTED : " + source_.type);
    }

}



export class PlanetarySystem {
    id: number;
    star: Star;

    // TODO Move in WorldData when more fine read/write can be done
    public time = new Convert.NumberTime();

    public hab_zone = new Convert.NumberLength();
    public hab_zone_in = new Convert.NumberLength();
    public hab_zone_out = new Convert.NumberLength();
    public frost_line = new Convert.NumberLength();
    public orbits_limit_in = new Convert.NumberLength();
    public orbits_limit_out = new Convert.NumberLength();

    constructor() {
        this.star = new Star();
    }

    public copy(source_: any) {
        Convert.copy(this, source_)

        return this;
    }

    public genStar(type?: string) {
        switch (type) {
            case "sun":
                this.star.makeClassG(1); break;
            case "long_life":
                this.star.genLongLifeStar(); break;
            case "any":
                this.star.genAnyStar(); break;
            case "habitable":
                this.star.genHabitableStar(); break;
            default:
                this.star.genHabitableStar(); break;
        }

        this.time.universal = 0

        this.hab_zone.au = Math.sqrt(this.star.luminosity);
        this.hab_zone_in.au = this.hab_zone.au * 0.95;
        this.hab_zone_out.au = this.hab_zone.au * 1.37;

        this.orbits_limit_in.au = 0.1 * this.star.mass.sm
        this.orbits_limit_out.au = 40 * this.star.mass.sm
        this.frost_line.au = 4.85 * this.hab_zone.au

        return this;
    }

    public genLargestFrostGiantOrbit() {
        var rnd_length = Random.random_float_clamp(1, 1.2);

        var instance = this.frost_line.clone();
        instance.au += rnd_length;

        return instance
    }



    public genOrbitsUniform() {
        this.time.universal = 0

        this.star.clearSats();

        var orb_size = Random.random_int_clamp(6, 8)

        var last_orbit = this.orbits_limit_in.clone()
        for (let index = 0; index < orb_size; index++) {
            // var orb_dist = Planet.new().randomUniform();
            var orb_dist = Planet.new().randomSane();
            orb_dist.semimajor_axis = last_orbit
            this.star.addSat(orb_dist)
            last_orbit.au += 4;
        }

        var orb_dist = Planet.new().randomSane();
        orb_dist.semimajor_axis = this.orbits_limit_out.clone().mul(1.5)
        this.star.addSat(orb_dist)

        var last_orb = Orbit.new().randomSane();
        last_orb.semimajor_axis = this.orbits_limit_out.clone().mul(0.4)
        orb_dist.addSat(last_orb)

        var last_orb = Orbit.new().randomSane();
        last_orb.semimajor_axis = this.orbits_limit_out.clone().mul(0.4)
        orb_dist.addSat(last_orb)

        var last_last_orb = Orbit.new().randomSane();
        last_last_orb.semimajor_axis = this.orbits_limit_out.clone().mul(0.2)
        last_orb.addSat(last_last_orb)

        var last_last_orb = Orbit.new().randomSane();
        last_last_orb.semimajor_axis = this.orbits_limit_out.clone().mul(0.2)
        last_orb.addSat(last_last_orb)


        // var sangle = 0
        // for (const iterator of this.star.satelites) {
        //     iterator.eccentricity = 0.01 + sangle / 100
        //     // iterator.eccentricity = 0.5

        //     // iterator.argument_of_perihelion.deg = sangle * 2
        //     // iterator.argument_of_perihelion.deg = 90

        //     // iterator.argument_of_perihelion.deg = sangle*2
        //     // iterator.argument_of_perihelion.deg = 0

        //     // iterator.inclination.deg = sangle / 2
        //     // iterator.inclination.deg = 45
        //     iterator.inclination.deg = 1
        //     sangle += 10
        // }



        console.debug("this.star.satelites.length", this.star.satelites.length);

        return this;
    }


    public genOrbitsSimple() {
        this.time.universal = 0

        this.star.clearSats();

        var lfg_orbit = this.genLargestFrostGiantOrbit();

        var last_orbit = lfg_orbit.clone();
        while (true) {
            var is_valid = false;
            var tmp_orbit = last_orbit.clone();

            for (let index = 0; index < 10; index++) {
                tmp_orbit.au = last_orbit.au / Random.random_float_clamp(1.4, 2)

                if (Math.abs(tmp_orbit.au - last_orbit.au) < 0.15)
                    continue
                if (tmp_orbit.au < this.orbits_limit_in.au)
                    continue
                last_orbit = tmp_orbit;
                is_valid = true;
                break;
            }

            if (is_valid) {
                var orb_dist = Orbit.new().randomSane();
                orb_dist.semimajor_axis = last_orbit
                this.star.addSat(orb_dist)
            }
            else
                break;
        }
        // this.star.satelites_km.reverse();

        last_orbit = lfg_orbit;
        while (true) {
            var is_valid = false;
            var tmp_orbit = last_orbit.clone();

            for (let index = 0; index < 10; index++) {
                tmp_orbit.au = last_orbit.au * Random.random_float_clamp(1.4, 2)

                if (Math.abs(tmp_orbit.au - last_orbit.au) < 0.15)
                    continue
                if (tmp_orbit.au > this.orbits_limit_out.au)
                    continue
                last_orbit = tmp_orbit;
                is_valid = true;
                break;
            }

            if (is_valid) {
                var orb_dist = Orbit.new().randomSane();
                orb_dist.semimajor_axis = last_orbit
                this.star.addSat(orb_dist)

                // var orb_sat1 = Orbit.new().randomSane();
                // orb_sat1.semimajor_axis = last_orbit
                // orb_sat1.semimajor_axis.au *= 0.5
                // orb_sat1.updateMajEcc()
                // orb_dist.addSat(orb_sat1)
            }
            else
                break;
        }

        this.star.satelites.sort((a, b) => a.semimajor_axis.value - b.semimajor_axis.value);
        console.debug("this.star.satelites.length", this.star.satelites.length);

        return this;
    }



}