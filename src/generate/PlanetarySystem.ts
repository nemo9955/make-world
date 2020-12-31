import { Star } from "./Star";
import { Orbit } from "./Orbit";
import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian

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

    orbits_distances = new Array<Orbit>();

    constructor() {
        this.star = new Star();
    }

    public copy(source_: any) {
        Convert.copy(this, source_)

        this.orbits_distances.length = 0;
        for (const iterator of source_.orbits_distances) {
            this.orbits_distances.push(new Orbit().copy(iterator))
        }

        return this;
    }

    public genStar(type?: string) {
        switch (type) {
            case "long_life":
                this.star.genLongLifeStar();
                break;
            case "any":
                this.star.genAnyStar();
                break;
            case "habitable":
                this.star.genHabitableStar();
                break;
            default:
                this.star.genHabitableStar();
                break;
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

    public genOrbitsSimple() {
        this.time.universal = 0

        this.orbits_distances.length = 0;
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
                var orb_dist = new Orbit().random_sane();
                orb_dist.semimajor_axis = last_orbit
                this.orbits_distances.push(orb_dist)
            }
            else
                break;
        }
        // this.orbits_distances_km.reverse();

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
                var orb_dist = new Orbit().random_sane();
                orb_dist.semimajor_axis = last_orbit
                this.orbits_distances.push(orb_dist)
            }
            else
                break;
        }

        this.orbits_distances.sort((a, b) => a.semimajor_axis.value - b.semimajor_axis.value);

        // var sangle = 0
        // for (const iterator of this.orbits_distances) {
        //     iterator.eccentricity = 0.7

        //     // iterator.longitude_perihelion.deg = sangle * 2
        //     iterator.longitude_perihelion.deg = 0

        //     iterator.longitude_ascending_node.deg = sangle*4
        //     // iterator.longitude_ascending_node.deg = 0

        //     // iterator.inclination.deg = sangle / 5
        //     iterator.inclination.deg = 20
        //     sangle += 10
        // }

        return this;
    }



}