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

    private starts = new Array<Star>();

    constructor() {
        // this.star = new Star();
        this.orbit = Orbit.new();
        this.type = this.constructor.name;
    }


    init() {
        this.id = Math.ceil(Math.random() * 10000) + 1000
    }

    public copyDeep(source_: any) {
        this.clearAllSats()
        Convert.copyDeep(this, source_)

        return this;
    }

    public copyShallow(source_: any) {
        Convert.copyShallow(this, source_)
        return this;
    }

    public genPTypeStarts() {
        this.clearAllSats()
        var star1_ = new Star()
        var star2_ = new Star()

        star1_.orbit.randomSane()
        star1_.semimajor_axis.km = 10000000
        star1_.orbit.updateMajEcc()
        star1_.genHabitableStar()

        star2_.orbit.copyShallow(star1_.orbit)
        star2_.orbit.mean_longitude.deg += 180;
        star2_.genHabitableStar()

        this.addSat(star1_)
        this.addSat(star2_)


        this.time.universal = 0

        // TODO check is just adding these values is "good enough" or implement proper
        var stars_lum_ = star1_.luminosity.clone().add(star2_.luminosity.value)
        var stars_mass_ = star1_.mass.clone().add(star2_.mass.value)

        this.hab_zone.au = Math.sqrt(stars_lum_.watt);
        this.hab_zone_in.au = this.hab_zone.au * 0.95;
        this.hab_zone_out.au = this.hab_zone.au * 1.37;

        this.orbits_limit_in.au = 0.1 * stars_mass_.sm
        this.orbits_limit_out.au = 40 * stars_mass_.sm
        this.frost_line.au = 4.85 * this.hab_zone.au

        return this;
    }

    public genStar(type?: string) {
        this.clearAllSats()
        var star_ = new Star()
        switch (type) {
            case "sun":
                star_.makeClassG(1); break;
            case "long_life":
                star_.genLongLifeStar(); break;
            case "any":
                star_.genAnyStar(); break;
            case "habitable":
                star_.genHabitableStar(); break;
            default:
                star_.genHabitableStar(); break;
        }

        this.addSat(star_)

        this.time.universal = 0

        this.hab_zone.au = Math.sqrt(star_.luminosity.watt);
        this.hab_zone_in.au = this.hab_zone.au * 0.95;
        this.hab_zone_out.au = this.hab_zone.au * 1.37;

        this.orbits_limit_in.au = 0.1 * star_.mass.sm
        this.orbits_limit_out.au = 40 * star_.mass.sm
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

        this.orbit.clearNonStars();

        var orb_size = Random.random_int_clamp(6, 8)

        var last_orbit = this.orbits_limit_in.clone()
        for (let index = 0; index < orb_size; index++) {
            // var orb_dist = Planet.new().randomUniform();
            var orb_dist = Planet.new()
            orb_dist.orbit.randomSane();
            orb_dist.semimajor_axis.copy(last_orbit)
            this.addSat(orb_dist)
            last_orbit.au += 4;
        }

        var orb_dist = Planet.new()
        orb_dist.orbit.randomSane();
        orb_dist.semimajor_axis.copy(this.orbits_limit_out).mul(1.5)
        this.addSat(orb_dist)

        var last_orb = Orbit.new().randomSane();
        last_orb.semimajor_axis.copy(this.orbits_limit_out).mul(0.4)
        orb_dist.addSat(last_orb)

        var last_orb = Orbit.new().randomSane();
        last_orb.semimajor_axis.copy(this.orbits_limit_out).mul(0.4)
        orb_dist.addSat(last_orb)

        var last_last_orb = Orbit.new().randomSane();
        last_last_orb.semimajor_axis.copy(this.orbits_limit_out).mul(0.2)
        last_orb.addSat(last_last_orb)

        var last_last_orb = Orbit.new().randomSane();
        last_last_orb.semimajor_axis.copy(this.orbits_limit_out).mul(0.2)
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



        console.debug("this.star.satelites.length", this.orbit.satelites.length);

        return this;
    }


    public getOrbitElem(par_maj_axis: Convert.NumberLength) {

        if (Random.percent() < 50) {
            // binary planets
            var orbit_ = Orbit.new()
            orbit_.semimajor_axis.copy(par_maj_axis)

            var planet1_ = Planet.new()
            planet1_.orbit.randomSane()
            planet1_.semimajor_axis.copy(par_maj_axis)
            planet1_.semimajor_axis.value /= 20
            planet1_.radius.value = 30; // TODO FIXME does not reset on pool refresh somewhere

            var planet2_ = Planet.new().copyShallow(planet1_)
            planet2_.mean_longitude.deg += 180;

            orbit_.addSat(planet1_)
            orbit_.addSat(planet2_)
            // console.log("planet1_", planet1_.radius.value, planet1_);
            // console.log("planet2_", planet2_.radius.value, planet2_);
            return orbit_
        }

        var planet_ = Planet.new()
        planet_.orbit.randomSane();
        planet_.semimajor_axis.copy(par_maj_axis)
        return planet_
    }

    public genOrbitsSimpleMoons() {
        this.genOrbitsSimple();

        for (const orbit_ of this.orbit.satelites) {

            // console.log("orbit_.semimajor_axis.au", orbit_.semimajor_axis.au);

            if (orbit_.semimajor_axis.au < 0.6)
                continue; // skip small orbits
            if (Random.percent() < 20)
                continue; // only some to have moons

            var moons_total = 0

            if (orbit_.semimajor_axis.au < 2) {
                moons_total = Random.random_int_clamp(1, 2);
            }
            else if (orbit_.semimajor_axis.au < 10) {
                moons_total = Random.random_int_clamp(2, 3);
            }
            else {
                moons_total = Random.random_int_clamp(2, 5);
            }

            // console.log("moons_total", moons_total);

            for (let index = 0; index < moons_total; index++) {
                // var orb_dist = Planet.new().randomUniform();
                var orb_dist = Planet.new()
                orb_dist.orbit.randomSane();
                orb_dist.semimajor_axis.copy(orbit_.semimajor_axis)
                orb_dist.semimajor_axis.value /= 3
                orb_dist.semimajor_axis.value /= Random.random_float_clamp(3, 4)
                orb_dist.orbit.updateMajEcc();
                orbit_.addSat(orb_dist)
            }



        }
    }



    public genOrbitsSimple() {
        this.time.universal = 0

        this.orbit.clearNonStars();

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
                var orb_dist = this.getOrbitElem(last_orbit)
                // var orb_dist = Orbit.new().randomSane();
                // orb_dist.semimajor_axis = last_orbit
                this.addSat(orb_dist)
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
                var orb_dist = this.getOrbitElem(last_orbit)
                // var orb_dist = Orbit.new().randomSane();
                // orb_dist.semimajor_axis = last_orbit
                this.addSat(orb_dist)

                // var orb_sat1 = Orbit.new().randomSane();
                // orb_sat1.semimajor_axis = last_orbit
                // orb_sat1.semimajor_axis.au *= 0.5
                // orb_sat1.updateMajEcc()
                // orb_dist.addSat(orb_sat1)
            }
            else
                break;
        }

        this.orbit.satelites.sort((a, b) => a.semimajor_axis.value - b.semimajor_axis.value);
        console.debug("this.orbit.satelites.length", this.orbit.satelites.length);

        return this;
    }

    public clearAllSats() {
        this.starts.length = 0;
        this.orbit.clearAllSats();
    }
    public addSat(sat_: OrbitingElement) {
        this.orbit.addSat(sat_);
        if (sat_ instanceof Star)
            this.starts.push(sat_)
    }

    public free(): void { return; }
    public getStars(): Star[] {
        return this.starts
    }


}