import { Star } from "./Star";
import * as Random from "../utils/Random"

export class PlanetarySystem {
    id: number;

    star: Star;

    hab_zone_in: number;
    hab_zone: number;
    hab_zone_out: number;

    orbits_limit_in: number;
    frost_line: number;
    orbits_limit_out: number;

    orbits_distances: number[];

    constructor() {
        this.id = Math.ceil(Math.random() * 10000) + 1000
        this.star = new Star();
        this.orbits_distances = [];
    }


    clone(source_: PlanetarySystem) {
        // console.log("source_", source_);
        for (const key in source_) {
            const element = source_[key];
            switch (key) {
                case "star":
                    this.star.clone(element as Star); break;
                default:
                    this[key] = element; break;
            }
        }
        // console.log("this", this);
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

        this.hab_zone = Math.sqrt(this.star.luminosity);
        this.hab_zone_in = this.hab_zone * 0.95;
        this.hab_zone_out = this.hab_zone * 1.37;

        this.orbits_limit_in = 0.1 * this.star.mass
        this.orbits_limit_out = 40 * this.star.mass
        this.frost_line = 4.85 * this.hab_zone

        return this;
    }

    public genLargestFrostGiantOrbit() {
        var rnd_length = Random.random_float_clamp(1, 1.2)
        return this.frost_line + rnd_length;
    }

    public genOrbitsSimple() {
        this.orbits_distances = [];
        var lfg_orbit = this.genLargestFrostGiantOrbit();

        var last_orbit = lfg_orbit;
        while (true) {
            var is_valid = false;
            var tmp_orbit = last_orbit;

            for (let index = 0; index < 10; index++) {
                tmp_orbit = last_orbit / Random.random_float_clamp(1.4, 2)

                if (Math.abs(tmp_orbit - last_orbit) < 0.15)
                    continue
                if (tmp_orbit < this.orbits_limit_in)
                    continue
                last_orbit = tmp_orbit;
                is_valid = true;
                break;
            }

            if (is_valid)
                this.orbits_distances.push(last_orbit)
            else
                break;
        }
        // this.orbits_distances.reverse();

        last_orbit = lfg_orbit;
        while (true) {
            var is_valid = false;
            var tmp_orbit = last_orbit;

            for (let index = 0; index < 10; index++) {
                tmp_orbit = last_orbit * Random.random_float_clamp(1.4, 2)

                if (Math.abs(tmp_orbit - last_orbit) < 0.15)
                    continue
                if (tmp_orbit > this.orbits_limit_out)
                    continue
                last_orbit = tmp_orbit;
                is_valid = true;
                break;
            }

            if (is_valid)
                this.orbits_distances.push(last_orbit)
            else
                break;
        }

        this.orbits_distances.sort((a, b) => a - b);

        return this;
    }



}