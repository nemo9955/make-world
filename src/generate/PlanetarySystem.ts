import { Star } from "./Star";
import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian

export class PlanetarySystem {
    id: number;
    star: Star;

    private _hab_zone_km: number;
    public get hab_zone_km(): number { return this._hab_zone_km; }
    public set hab_zone_km(value: number) { this._hab_zone_km = value; }
    public get hab_zone_au(): number { return Convert.kmToAu(this._hab_zone_km); }
    public set hab_zone_au(value: number) { this._hab_zone_km = Convert.auToKm(value); }

    private _hab_zone_in_km: number;
    public get hab_zone_in_km(): number { return this._hab_zone_in_km; }
    public set hab_zone_in_km(value: number) { this._hab_zone_in_km = value; }
    public get hab_zone_in_au(): number { return Convert.kmToAu(this._hab_zone_in_km); }
    public set hab_zone_in_au(value: number) { this._hab_zone_in_km = Convert.auToKm(value); }

    private _hab_zone_out_km: number;
    public get hab_zone_out_km(): number { return this._hab_zone_out_km; }
    public set hab_zone_out_km(value: number) { this._hab_zone_out_km = value; }
    public get hab_zone_out_au(): number { return Convert.kmToAu(this._hab_zone_out_km); }
    public set hab_zone_out_au(value: number) { this._hab_zone_out_km = Convert.auToKm(value); }

    private _frost_line: number;
    public get frost_line_km(): number { return this._frost_line; }
    public set frost_line_km(value: number) { this._frost_line = value; }
    public get frost_line_au(): number { return Convert.kmToAu(this._frost_line); }
    public set frost_line_au(value: number) { this._frost_line = Convert.auToKm(value); }

    private _orbits_limit_in: number;
    public get orbits_limit_in_km(): number { return this._orbits_limit_in; }
    public set orbits_limit_in_km(value: number) { this._orbits_limit_in = value; }
    public get orbits_limit_in_au(): number { return Convert.kmToAu(this._orbits_limit_in); }
    public set orbits_limit_in_au(value: number) { this._orbits_limit_in = Convert.auToKm(value); }

    // orbits_limit_out: Convert.NumberKm = new Convert.NumberKm();
    private _orbits_limit_out: number;
    public get orbits_limit_out_km(): number { return this._orbits_limit_out; }
    public set orbits_limit_out_km(value: number) { this._orbits_limit_out = value; }
    public get orbits_limit_out_au(): number { return Convert.kmToAu(this._orbits_limit_out); }
    public set orbits_limit_out_au(value: number) { this._orbits_limit_out = Convert.auToKm(value); }

    orbits_distances_km: number[];

    constructor() {
        this.star = new Star();
        this.orbits_distances_km = [];
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

        this.hab_zone_au = Math.sqrt(this.star.luminosity);
        this.hab_zone_in_au = this.hab_zone_au * 0.95;
        this.hab_zone_out_au = this.hab_zone_au * 1.37;

        this.orbits_limit_in_au = 0.1 * this.star.mass_sm
        this.orbits_limit_out_au = 40 * this.star.mass_sm
        this.frost_line_au = 4.85 * this.hab_zone_au

        return this;
    }

    public genLargestFrostGiantOrbit() {
        var rnd_length = Random.random_float_clamp(1, 1.2)
        return this.frost_line_au + rnd_length;
    }

    public genOrbitsSimple() {
        this.orbits_distances_km.length = 0;
        var lfg_orbit = this.genLargestFrostGiantOrbit();

        var last_orbit = lfg_orbit;
        while (true) {
            var is_valid = false;
            var tmp_orbit = last_orbit;

            for (let index = 0; index < 10; index++) {
                tmp_orbit = last_orbit / Random.random_float_clamp(1.4, 2)

                if (Math.abs(tmp_orbit - last_orbit) < 0.15)
                    continue
                if (tmp_orbit < this.orbits_limit_in_au)
                    continue
                last_orbit = tmp_orbit;
                is_valid = true;
                break;
            }

            if (is_valid)
                this.orbits_distances_km.push(Convert.auToKm(last_orbit))
            else
                break;
        }
        // this.orbits_distances_km.reverse();

        last_orbit = lfg_orbit;
        while (true) {
            var is_valid = false;
            var tmp_orbit = last_orbit;

            for (let index = 0; index < 10; index++) {
                tmp_orbit = last_orbit * Random.random_float_clamp(1.4, 2)

                if (Math.abs(tmp_orbit - last_orbit) < 0.15)
                    continue
                if (tmp_orbit > this.orbits_limit_out_au)
                    continue
                last_orbit = tmp_orbit;
                is_valid = true;
                break;
            }

            if (is_valid)
                this.orbits_distances_km.push(Convert.auToKm(last_orbit))
            else
                break;
        }

        this.orbits_distances_km.sort((a, b) => a - b);

        return this;
    }



}