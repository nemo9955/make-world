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

    public orbits_distances = new Array<Orbit>();

    constructor() {
        this.star = new Star();
    }

    public copy(source_: any) {
        Convert.copy(this, source_)


        this.clear_orbits();
        for (let index = 0; index < source_.orbits_distances.length; index++)
            this.orbits_distances.push(Orbit.new().copy(source_.orbits_distances[index]))

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



    private clear_orbits() {
        while (this.orbits_distances.length > 0)
            Orbit.free(this.orbits_distances.pop());
    }


    public genOrbitsUniform() {
        this.time.universal = 0

        this.clear_orbits();

        var orb_size = Random.random_int_clamp(4, 7)

        var last_orbit = this.orbits_limit_in.clone()
        for (let index = 0; index < orb_size; index++) {
            var orb_dist = Orbit.new().random_uniform();
            orb_dist.semimajor_axis = last_orbit
            this.orbits_distances.push(orb_dist)
            last_orbit.au += 3.5;
        }

        var orb_dist = Orbit.new().random_uniform();
        orb_dist.semimajor_axis = this.orbits_limit_out
        this.orbits_distances.push(orb_dist)


        console.debug("this.orbits_distances.length", this.orbits_distances.length);

        return this;
    }


    public genOrbitsSimple() {
        this.time.universal = 0

        this.clear_orbits();

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
                var orb_dist = Orbit.new().random_sane();
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
                var orb_dist = Orbit.new().random_sane();
                orb_dist.semimajor_axis = last_orbit
                this.orbits_distances.push(orb_dist)
            }
            else
                break;
        }

        this.orbits_distances.sort((a, b) => a.semimajor_axis.value - b.semimajor_axis.value);
        console.debug("this.orbits_distances.length", this.orbits_distances.length);

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