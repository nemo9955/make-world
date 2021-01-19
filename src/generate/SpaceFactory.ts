import { Star } from "./Star";
import { Orbit, OrbitingElement } from "./Orbit";
import { Planet } from "./Planet";

import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { PlanetarySystem } from "./PlanetarySystem";


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian


export class SpaceConfig {


}


export class SpaceFactory {
    // spaceConf: SpaceFactoryConfig = null;
    public spaceConf: SpaceConfig = new SpaceConfig();

    // TODO things to add, with parameters being in SpaceConfig!
    // genMainOrbits ... bool ensure_habitable
    // // make just the main orbits and add after
    // addMoons ... number how_many , bool make_harmonics

    public genDebugg(plsys: PlanetarySystem, root: OrbitingElement) {
        // this.manager.world.planetary_system.genStar("sun");
        // this.manager.world.planetary_system.genOrbitsUniform();
        this.genStar(plsys, plsys, "sun")
        this.genOrbitsUniform(plsys, plsys)
    }

    public genStartingPlanetSystem(plsys: PlanetarySystem) {
        // this.genStar(plsys, plsys, "sun")
        this.genStar(plsys, plsys, "habitable")
        // plsys.genStar()
        this.genOrbitsSimpleMoons(plsys, plsys)
        // plsys.genOrbitsSimple()
    }

    public genOrbitsUniform(plsys: PlanetarySystem, root: OrbitingElement) {
        plsys.time.universal = 0

        root.orbit.clearNonStars();

        var orb_size = Random.random_int_clamp(6, 8)

        var last_orbit = plsys.orbits_limit_in.clone()
        for (let index = 0; index < orb_size; index++) {
            // var orb_dist = Planet.new().randomUniform();
            var orb_dist = Planet.new()
            orb_dist.orbit.randomSane();
            orb_dist.semimajor_axis.copy(last_orbit)
            root.addSat(orb_dist)
            last_orbit.au += 4;
        }

        var orb_dist = Planet.new()
        orb_dist.orbit.randomSane();
        orb_dist.semimajor_axis.copy(plsys.orbits_limit_out).mul(1.5)
        root.addSat(orb_dist)

        var last_orb = Orbit.new().randomSane();
        last_orb.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.4)
        orb_dist.addSat(last_orb)

        var last_orb = Orbit.new().randomSane();
        last_orb.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.4)
        orb_dist.addSat(last_orb)

        var last_last_orb = Orbit.new().randomSane();
        last_last_orb.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.2)
        last_orb.addSat(last_last_orb)

        var last_last_orb = Orbit.new().randomSane();
        last_last_orb.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.2)
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



        console.debug("root.satelites.length", root.satelites.length);

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


    public genPTypeStarts(plsys: PlanetarySystem, root: OrbitingElement) {
        root.clearSatelites()
        var star1_ = new Star()
        var star2_ = new Star()

        star1_.orbit.randomSane()
        star1_.semimajor_axis.km = 10000000
        star1_.orbit.updateMajEcc()
        star1_.genHabitableStar()

        star2_.orbit.copyShallow(star1_.orbit)
        star2_.orbit.mean_longitude.deg += 180;
        star2_.genHabitableStar()

        root.addSat(star1_)
        root.addSat(star2_)


        plsys.time.universal = 0

        // TODO check is just adding these values is "good enough" or implement proper
        var stars_lum_ = star1_.luminosity.clone().add(star2_.luminosity.value)
        var stars_mass_ = star1_.mass.clone().add(star2_.mass.value)

        plsys.hab_zone.au = Math.sqrt(stars_lum_.watt);
        plsys.hab_zone_in.au = plsys.hab_zone.au * 0.95;
        plsys.hab_zone_out.au = plsys.hab_zone.au * 1.37;

        plsys.orbits_limit_in.au = 0.1 * stars_mass_.sm
        plsys.orbits_limit_out.au = 40 * stars_mass_.sm
        plsys.frost_line.au = 4.85 * plsys.hab_zone.au
    }

    public genStar(plsys: PlanetarySystem, root: OrbitingElement, type?: string) {
        root.clearSatelites()
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

        root.addSat(star_)

        plsys.time.universal = 0

        plsys.hab_zone.au = Math.sqrt(star_.luminosity.watt);
        plsys.hab_zone_in.au = plsys.hab_zone.au * 0.95;
        plsys.hab_zone_out.au = plsys.hab_zone.au * 1.37;

        plsys.orbits_limit_in.au = 0.1 * star_.mass.sm
        plsys.orbits_limit_out.au = 40 * star_.mass.sm
        plsys.frost_line.au = 4.85 * plsys.hab_zone.au
    }


    public genOrbitsSimpleMoons(plsys: PlanetarySystem, root: OrbitingElement) {
        this.genOrbitsSimple(plsys, root);

        for (const orbit_ of root.satelites) {

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


    public getLargestFrostGiantOrbit(plsys: PlanetarySystem) {
        var rnd_length = Random.random_float_clamp(1, 1.2);

        var instance = plsys.frost_line.clone();
        instance.au += rnd_length;

        return instance
    }

    public genOrbitsSimple(plsys: PlanetarySystem, root: OrbitingElement) {
        plsys.time.universal = 0

        root.orbit.clearNonStars();

        var lfg_orbit = this.getLargestFrostGiantOrbit(plsys);

        var last_orbit = lfg_orbit.clone();
        while (true) {
            var is_valid = false;
            var tmp_orbit = last_orbit.clone();

            for (let index = 0; index < 10; index++) {
                tmp_orbit.au = last_orbit.au / Random.random_float_clamp(1.4, 2)

                if (Math.abs(tmp_orbit.au - last_orbit.au) < 0.15)
                    continue
                if (tmp_orbit.au < plsys.orbits_limit_in.au)
                    continue
                last_orbit = tmp_orbit;
                is_valid = true;
                break;
            }

            if (is_valid) {
                var orb_dist = this.getOrbitElem(last_orbit)
                // var orb_dist = Orbit.new().randomSane();
                // orb_dist.semimajor_axis = last_orbit
                root.addSat(orb_dist)
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
                if (tmp_orbit.au > plsys.orbits_limit_out.au)
                    continue
                last_orbit = tmp_orbit;
                is_valid = true;
                break;
            }

            if (is_valid) {
                var orb_dist = this.getOrbitElem(last_orbit)
                // var orb_dist = Orbit.new().randomSane();
                // orb_dist.semimajor_axis = last_orbit
                root.addSat(orb_dist)

                // var orb_sat1 = Orbit.new().randomSane();
                // orb_sat1.semimajor_axis = last_orbit
                // orb_sat1.semimajor_axis.au *= 0.5
                // orb_sat1.updateMajEcc()
                // orb_dist.addSat(orb_sat1)
            }
            else
                break;
        }

        root.satelites.sort((a, b) => a.semimajor_axis.value - b.semimajor_axis.value);
        console.debug("this.orbit.satelites.length", root.satelites.length);

        return this;
    }

}