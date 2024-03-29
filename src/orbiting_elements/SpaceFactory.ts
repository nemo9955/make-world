import { Star } from "./Star";
import { Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";
import { Planet } from "./Planet";

import * as Random from "../utils/Random"
import { Uniform } from "three";
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { PlanetarySystem } from "./PlanetarySystem";
import { WorldData } from "../modules/WorldData";
import { SpaceGroup } from "./SpaceGroup";
import { Config } from "../modules/Config";
import { tree } from "d3";


// https://www.youtube.com/watch?v=J5xU-8Kb63Y&list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&index=11&ab_channel=Artifexian
// MOONS : https://www.youtube.com/watch?reload=9&v=t6i6TPsqvaM&ab_channel=Artifexian

// Why Don’t Moons Have Moons?
// https://medium.com/amazing-science/why-dont-moons-have-moons-c15171471864

// TODO for fun, at random, add seccond main planets to existing main orbits at L4 or L5 to first one
// https://en.wikipedia.org/wiki/Lagrange_point#L4_and_L5


export class SpaceFactory {

    public worldData: WorldData;
    public config: Config = new Config();

    public getWorldData(): WorldData { return this.worldData; }

    constructor(worldData: WorldData) {
        this.worldData = worldData;
    }



    public genStartingPlanetSystem(plsys: PlanetarySystem) {
        plsys.clearSatelites();
        if (Random.randPercent() < 60)
            this.genStar(plsys, plsys, "habitable")
        else
            this.genPTypeStarts(plsys, plsys)

        // this.genOrbitsSimple(plsys, plsys.root())
        // this.genOrbitsUniform(plsys, plsys.root())
        this.genOrbitsSimpleMoons(plsys, plsys.root())
    }

    // public genDebugg(plsys: PlanetarySystem, root: OrbitingElement) {
    //     // this.manager.world.planetary_system.genStar("sun");
    //     // this.manager.world.planetary_system.genOrbitsUniform();
    //     this.genStar(plsys, plsys, "sun")
    //     this.genOrbitsUniform(plsys, plsys.root())
    //     // plsys.computeAll();
    // }


    public genOrbitsUniform(plsys: PlanetarySystem, root: OrbitingElement) {
        this.getWorldData().restartTime();

        root.clearNonStars();

        // var orb_size = Random.random_int_clamp(3, 5)
        // var orb_size = Random.random_int_clamp(6, 8)
        var orb_size = 2

        var last_orbit = plsys.orbits_limit_in.clone()
        for (let index = 0; index < orb_size; index++) {
            // var orb_dist = new Planet(this.getWorldData()).randomUniform();
            // var orb_dist = new Planet(this.getWorldData())
            var orb_dist = new Orbit(this.getWorldData()).randomSane();
            orb_dist.randomSane();
            orb_dist.semimajor_axis.copy(last_orbit)
            root.addSat(orb_dist)
            last_orbit.au += 4;
        }

        // var orb_dist = new Planet(this.getWorldData())
        var orb_dist = new Orbit(this.getWorldData()).randomSane();
        orb_dist.randomSane();
        orb_dist.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.9)
        root.addSat(orb_dist)

        var last_orb = new Orbit(this.getWorldData()).randomSane();
        last_orb.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.4)
        orb_dist.addSat(last_orb)

        // var last_orb = new Orbit(this.getWorldData()).randomSane();
        // last_orb.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.4)
        // orb_dist.addSat(last_orb)

        var last_last_orb = new Orbit(this.getWorldData()).randomSane();
        last_last_orb.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.2)
        last_orb.addSat(last_last_orb)

        // var last_last_orb = new Orbit(this.getWorldData()).randomSane();
        // last_last_orb.semimajor_axis.copy(plsys.orbits_limit_out).mul(0.2)
        // last_orb.addSat(last_last_orb)


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


        root.computeAll();
        console.debug("root.satelites.length", root.satelites.length);
    }


    public getOrbitElem(smajax: Convert.NumberLength, plsys: PlanetarySystem) {

        if (Random.randPercent() < 40 && smajax.au > 0.7) {
            // binary planets
            var group_ = new SpaceGroup(this.getWorldData())
            group_.combineChildrenMass = true;

            var orbit_ = new Orbit(this.getWorldData())
            orbit_.randomForMainOrbit(smajax, plsys);

            var orbit1_ = new Orbit(this.getWorldData());
            orbit1_.randomForClusters(2, smajax, plsys);
            var planet1_ = new Planet(this.getWorldData())
            planet1_.randomBinaryOrbit(0, orbit_.semimajor_axis, plsys)
            orbit1_.addSat(planet1_)
            group_.addToSpaceGroup(orbit1_)

            var orbit2_ = orbit1_.clone();
            orbit2_.mean_longitude.deg += 180;
            var planet2_ = new Planet(this.getWorldData())
            planet2_.randomBinaryOrbit(1, orbit_.semimajor_axis, plsys)
            orbit2_.addSat(planet2_)
            group_.addToSpaceGroup(orbit2_)

            orbit_.addSat(group_)
            return orbit_
        } else {

            var orbit_ = new Orbit(this.getWorldData())
            orbit_.randomForMainOrbit(smajax, plsys);

            var planet_ = new Planet(this.getWorldData())
            planet_.randomMainOrbit(orbit_.semimajor_axis, plsys)

            orbit_.addSat(planet_)
            orbit_.updateMajEcc()
            return orbit_

        }
    }


    public genPTypeStarts(plsys: PlanetarySystem, root: OrbitingElement) {
        root.clearSatelites()
        // console.debug("this.getWorldData().idObjMap", this.getWorldData().idObjMap);
        // console.debug("root.satelites.length,root.satelites", root.satelites.length, root.satelites);

        var group_ = new SpaceGroup(this.getWorldData())
        group_.combineChildrenMass = true;

        var star1_ = new Star(this.getWorldData())
        star1_.genHabitableStar()

        var star2_ = new Star(this.getWorldData())
        star2_.genHabitableStar()

        // star1_.setOrbiting(star2_)
        // star2_.setOrbiting(star1_)

        var orbit1_ = new Orbit(this.getWorldData())
        orbit1_.randomSane();
        orbit1_.semimajor_axis.km = 10000000
        orbit1_.updateMajEcc()
        orbit1_.addSat(star1_)

        var orbit2_ = orbit1_.clone()
        orbit2_.mean_longitude.deg += 180;
        orbit2_.addSat(star2_)


        group_.addToSpaceGroup(orbit1_)
        group_.addToSpaceGroup(orbit2_)
        root.addSat(group_)

        this.getWorldData().restartTime();

        // TODO check is just adding these values is "good enough" or implement proper
        var stars_lum_ = star1_.luminosity.clone().add(star2_.luminosity.value)
        var stars_mass_ = group_.getMass().clone();

        plsys.hab_zone.au = Math.sqrt(stars_lum_.watt);
        plsys.hab_zone_in.au = plsys.hab_zone.au * 0.95;
        plsys.hab_zone_out.au = plsys.hab_zone.au * 1.37;

        plsys.orbits_limit_in.au = 0.1 * stars_mass_.sm
        plsys.orbits_limit_out.au = 40 * stars_mass_.sm
        plsys.frost_line.au = 4.85 * plsys.hab_zone.au
        root.computeAll();
    }

    public genStar(plsys: PlanetarySystem, root: OrbitingElement, type?: string) {
        root.clearSatelites()

        console.log("plsys", plsys);

        var star_ = new Star(this.getWorldData())
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
        this.getWorldData().restartTime();

        plsys.hab_zone.au = Math.sqrt(star_.luminosity.watt);
        plsys.hab_zone_in.au = plsys.hab_zone.au * 0.95;
        plsys.hab_zone_out.au = plsys.hab_zone.au * 1.37;

        plsys.orbits_limit_in.au = 0.1 * star_.mass.sm
        plsys.orbits_limit_out.au = 40 * star_.mass.sm
        plsys.frost_line.au = 4.85 * plsys.hab_zone.au
        root.computeAll();
    }


    public genOrbitsSimpleMoons(plsys: PlanetarySystem, root: OrbitingElement) {
        this.genOrbitsSimple(plsys, root);
        root.computeAll();

        var moon_prev_orb = new Convert.NumberLength();

        for (const sat_ of root.getSats()) {

            if (sat_ instanceof Orbit === false) continue;
            var orbit_: Orbit = sat_ as Orbit
            var orbObject_ = orbit_.root(); // what moons will orbit
            var forceMinMoon = false;
            // TODO orbObject_ if mass (orbit_ parentMass?) is too small, no moons

            if (orbit_.isInHabZone && this.config.genEnsureMoonInHabZone)
                forceMinMoon = true;
            // console.log("orbit_.semimajor_axis.au", orbit_.semimajor_axis.au);

            if (orbit_.semimajor_axis.value < plsys.hab_zone_in.value * 0.6)
                continue; // skip small orbits
            if (Random.randPercent() < 20 && forceMinMoon == false)
                continue; // only some to have moons

            var moons_total = 0
            if (orbit_.semimajor_axis.au < 2)
                moons_total = Random.randClampInt(1, 2);
            else if (orbit_.semimajor_axis.au < 10)
                moons_total = Random.randClampInt(2, 3);
            else
                moons_total = Random.randClampInt(3, 4);

            if (forceMinMoon) {
                moons_total = Random.randClampInt(1, 2);
                if (orbObject_.type === "SpaceGroup")
                    moons_total = Random.randClampInt(0, 1);
            }

            // console.log("moons_total", moons_total);

            // TODO calculate proper min and max orbits of a planet
            moon_prev_orb.copy(orbit_.semimajor_axis);
            // moon_prev_orb.value /= Random.random_float_clamp(7, 8)
            moon_prev_orb.value /= 15

            for (let index = 0; index < moons_total; index++) {
                var orb_dist = new Orbit(this.getWorldData())
                orb_dist.randomSane();
                orb_dist.semimajor_axis.copy(moon_prev_orb)
                orb_dist.updateMajEcc();

                var planet_ = new Planet(this.getWorldData())
                planet_.makeMoon(orb_dist.semimajor_axis, orbit_.semimajor_axis, plsys);

                orb_dist.addSat(planet_);
                orbObject_.addSat(orb_dist)
                // orbit_.addSat(orb_dist)

                // moon_prev_orb.value *= Random.random_float_clamp(1.5, 1.6)
                moon_prev_orb.value *= 1.3
            }



        }
        root.computeAll();
    }


    public getLargestFrostGiantOrbit(plsys: PlanetarySystem) {
        var rnd_length = Random.randClampFloat(1, 1.2);

        var instance = plsys.frost_line.clone();
        instance.au += rnd_length;

        return instance
    }

    public isPlsysValid(plsys: PlanetarySystem, root: OrbitingElement, attempsPercent: number) {

        if (this.config.genEnsureCenteredInHabZone && attempsPercent < 0.7) {
            var hasHab = false;
            // TODO choose percent between min&max for better control
            var pushNumber = 3; // to bring values closer to habZoneMed
            var habZoneMed = (plsys.hab_zone_in.value + plsys.hab_zone_out.value) / 2;
            var habZoneMin = (plsys.hab_zone_in.value + (habZoneMed * pushNumber)) / (pushNumber + 1);
            var habZoneMax = ((habZoneMed * pushNumber) + plsys.hab_zone_out.value) / (pushNumber + 1);
            // console.log("====== plsys.hab_zone_in.value, plsys.hab_zone_out.value", plsys.hab_zone_in.value, plsys.hab_zone_out.value);
            // console.log("====== habZoneMin, habZoneMax", habZoneMin, habZoneMax);
            // console.log("habZoneMed", habZoneMed);
            for (const orb_ of root.getAllOrbits()) {
                if (true // do not jusge formating ... it works
                    && orb_.semimajor_axis.value > habZoneMin
                    && orb_.semimajor_axis.value < habZoneMax
                    // check also sminor to ensure whole orbit in hab zone
                    && orb_.semiminor_axis.value > habZoneMin
                    && orb_.semiminor_axis.value < habZoneMax
                ) {
                    orb_.isInHabZone = true;
                    hasHab = true;
                }
                // console.log("orb_.semimajor_axis.value, orb_.semiminor_axis.value", hasHab, orb_.semimajor_axis.value, orb_.semiminor_axis.value);
            }
            if (hasHab == false) return false;
        }


        if (this.config.genEnsureInHabZone && attempsPercent < 0.8) {
            // console.log("====== plsys.hab_zone_out.value, plsys.hab_zone_in.value", plsys.hab_zone_out.Gm, plsys.hab_zone_in.Gm);
            var hasHab = false;
            for (const orb_ of root.getAllOrbits()) {
                if (true // do not jusge formating ... it works
                    && orb_.semimajor_axis.value > plsys.hab_zone_in.value
                    && orb_.semimajor_axis.value < plsys.hab_zone_out.value
                    // check also sminor to ensure whole orbit in hab zone
                    && orb_.semiminor_axis.value > plsys.hab_zone_in.value
                    && orb_.semiminor_axis.value < plsys.hab_zone_out.value
                ) {
                    orb_.isInHabZone = true;
                    hasHab = true;
                }
                // console.log("orb_.semimajor_axis.value, orb_.semiminor_axis.value", hasHab, orb_.semimajor_axis.Gm, orb_.semiminor_axis.Gm);
            }
            if (hasHab == false) return false;
        }

        return true;
    }

    public genOrbitsSimple(plsys: PlanetarySystem, root: OrbitingElement) {
        const genMaxAttemps = 100;
        var genAttemps = 0;
        var attempsPercent = 0;
        for (genAttemps = 0; genAttemps < genMaxAttemps; genAttemps++) {
            attempsPercent = genAttemps / genMaxAttemps
            // not a while(true) loop to prevent blocking the code

            this.getWorldData().restartTime();
            root.clearNonStars();
            var lfg_orbit = this.getLargestFrostGiantOrbit(plsys);

            var last_orbit = lfg_orbit.clone();
            while (true) {
                var is_valid = false;
                var tmp_orbit = last_orbit.clone();

                for (let index = 0; index < 10; index++) {
                    tmp_orbit.au = last_orbit.au / Random.randClampFloat(1.4, 2)

                    if (Math.abs(tmp_orbit.au - last_orbit.au) < 0.15)
                        continue
                    if (tmp_orbit.au < plsys.orbits_limit_in.au)
                        continue
                    last_orbit = tmp_orbit;
                    is_valid = true;
                    break;
                }

                if (is_valid) {
                    var orb_dist = this.getOrbitElem(last_orbit, plsys)
                    // var orb_dist = new Orbit(this.getWorldData()).randomSane();
                    // orb_dist.semimajor_axis = last_orbit
                    root.addSat(orb_dist)
                }
                else
                    break;
            }

            if (this.isPlsysValid(plsys, root, attempsPercent) == false)
                continue;


            last_orbit = lfg_orbit;
            while (true) {
                var is_valid = false;
                var tmp_orbit = last_orbit.clone();

                for (let index = 0; index < 10; index++) {
                    tmp_orbit.au = last_orbit.au * Random.randClampFloat(1.4, 2)

                    if (Math.abs(tmp_orbit.au - last_orbit.au) < 0.15)
                        continue
                    if (tmp_orbit.au > plsys.orbits_limit_out.au)
                        continue
                    last_orbit = tmp_orbit;
                    is_valid = true;
                    break;
                }

                if (is_valid) {
                    var orb_dist = this.getOrbitElem(last_orbit, plsys)
                    // var orb_dist = new Orbit(this.getWorldData()).randomSane();
                    // orb_dist.semimajor_axis = last_orbit
                    root.addSat(orb_dist)

                    // var orb_sat1 = new Orbit(this.getWorldData()).randomSane();
                    // orb_sat1.semimajor_axis = last_orbit
                    // orb_sat1.semimajor_axis.au *= 0.5
                    // orb_sat1.updateMajEcc()
                    // orb_dist.addSat(orb_sat1)
                }
                else
                    break;
            }

            break;
        }

        if (attempsPercent > 0.1) {
            console.warn(`Generating took quite a few attemps: ${attempsPercent} ${genAttemps} ${genMaxAttemps}`);
            // console.warn("this", this);
        }

        // root.satelites.sort((a, b) =>
        //     this.getWorldData().idObjMap.get(a).semimajor_axis.value -
        //     this.getWorldData().idObjMap.get(b).semimajor_axis.value);
        console.debug("this.orbit.satelites.length", root.satelites.length);

        root.computeAll();
        return this;
    }

}