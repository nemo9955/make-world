
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { Identifiable } from "../modules/DataBaseManager";
import { orbit_types_, WorldData } from "../modules/WorldData";
import { Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";
import { PlanetarySystem } from "./PlanetarySystem";

// https://en.wikipedia.org/wiki/List_of_gravitationally_rounded_objects_of_the_Solar_System

// TODO more proper and complex planets and moons generation
// https://youtu.be/t6i6TPsqvaM?t=257
// https://www.youtube.com/watch?v=Evq7n2cCTlg&ab_channel=Artifexian


// TODO generate some predefined planet compositions
// // random size and composition (water, rock, iron) and get mass and density based on proportions, etc
// TODO calc inner and outer limit

export class Planet extends OrbitingElement {

    public readonly orbLimitOut = new Convert.NumberLength(); // hill sphere
    public readonly orbLimitIn = new Convert.NumberLength(); // roche limit

    public readonly radius = new Convert.NumberLength();
    public readonly mass = new Convert.NumberMass();
    public readonly density = new Convert.NumberDensity();



    constructor(worldData: WorldData) {
        super(worldData);
        this.type = this.constructor.name;

        this.radius.value = 1;
        this.mass.value = 1;
        this.density.value = 1;
    }


    public makeEarthLike() {
        // ver 1 : https://youtu.be/RxbIoIM_Uck?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=64
        this.mass.em = Random.random_float_clamp(0.4, 2.35);
        this.radius.er = Random.random_float_clamp(0.78, 1.25);
        // this.surfaceGravity = Random.random_float_clamp(0.68,1.5);

        // ver 2 : https://youtu.be/RxbIoIM_Uck?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=81
        // this.mass.em = Random.random_float_clamp(0.1, 3.5);
        // this.radius.er = Random.random_float_clamp(0.5, 1.5);
        // this.surfaceGravity = Random.random_float_clamp(0.4,1.6);

        console.log("this.radius.km", this.radius.km, "makeEarthLike");

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setSiRadius(this.mass, this.radius);
    }


    public makeDwarf() {
        // https://youtu.be/XEIsZjQ_OdU?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=67
        this.mass.em = Random.random_float_clamp(0.0001, 0.1);

        this.radius.er = Random.random_float_clamp(0.03, 0.5); // CHECK what is the max

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setSiRadius(this.mass, this.radius);
    }

    public makeGassGiant() {
        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=22
        // 13 Jupiter Mass == 13 * 317.8 Earth Mass
        this.mass.jupm = Random.random_float_clamp(2, 13);

        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=35
        this.radius.jupr = Random.random_float_clamp(0.9, 1.1); // Add SOME wiggle

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setSiRadius(this.mass, this.radius);
    }

    public makePuffyGiantPlanet() {
        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=22
        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=98
        this.mass.em = Random.random_float_clamp(10, Convert.jupEarthMass(2));

        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=35
        this.radius.jupr = Random.random_float_clamp(1, 3); // CHECK what is the max

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setSiRadius(this.mass, this.radius);
    }

    public makeGassDwarf() {
        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=179
        this.mass.em = Random.random_float_clamp(1, 20);

        this.radius.er = Random.random_float_clamp(2, 5); // CHECK what is the max

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setSiRadius(this.mass, this.radius);
    }


    public randomMainOrbit(smajax: Convert.NumberLength, plsys: PlanetarySystem) {
        return this.makeTypes(["all"], smajax, plsys);
    }

    public randomBinaryOrbit(planetIndex: number, smajax: Convert.NumberLength, plsys: PlanetarySystem) {
        var tags = ["all"];
        if (planetIndex >= 1)
            tags = ["nohab"];
        return this.makeTypes(tags, smajax, plsys);
    }


    public makeTypes(tags: string[], smajax: Convert.NumberLength, plsys: PlanetarySystem) {
        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=244 gass giants
        // get a main platet suitable to it's orbit

        // min-max valid orbit in au
        // pick = what is returned by function
        var picks: Random.OverlapingData[] = []

        var minOrb = plsys.orbits_limit_in.au
        var maxOrb = plsys.orbits_limit_out.au
        var habOrb = (plsys.hab_zone_in.au + plsys.hab_zone_out.au) / 2
        var frostOrb = plsys.frost_line.au

        picks.push({ min: -minOrb, max: maxOrb * 200, chance: 0.0001, pick: this.makeEarthLike.bind(this) })

        // if (["all", "hab"].filter(x => tags.includes(x))) {
        //     picks.push({ min: plsys.hab_zone_in.au, max: plsys.hab_zone_out.au, chance: 1000000, pick: this.makeEarthLike.bind(this) })
        //     picks.push({ min: minOrb, max: habOrb * 2, chance: 3, pick: this.makeEarthLike.bind(this) })
        // }
        // if (["all", "nohab"].filter(x => tags.includes(x)))
        //     picks.push({ min: 0, max: 0, chance: 1, pick: this.makeDwarf.bind(this) })
        // if (["all", "nohab"].filter(x => tags.includes(x)))
        //     picks.push({ min: minOrb, max: frostOrb * 0.6, chance: 1, pick: this.makePuffyGiantPlanet.bind(this) })
        // if (["all", "nohab"].filter(x => tags.includes(x)))
        //     picks.push({ min: frostOrb * 0.6, max: frostOrb * 2, chance: 1, pick: this.makeGassGiant.bind(this) })
        // if (["all", "nohab"].filter(x => tags.includes(x)))
        //     picks.push({ min: frostOrb, max: maxOrb * 2, chance: 5, pick: this.makeGassGiant.bind(this) })
        // if (["all", "nohab"].filter(x => tags.includes(x)))
        //     picks.push({ min: frostOrb * 0.6, max: maxOrb * 2, chance: 6, pick: this.makeGassDwarf.bind(this) })

        var pickedMake = Random.pickChanceOverlaping(smajax.au, picks)
        return pickedMake.pick();
    }


    public compute() {
        var orbit_ = this.getDirectOrbit();
        var parentMass = this.getParentMass().clone();

        var minMass = this.mass.value
        var maxMass = parentMass.value
        if (minMass > maxMass)
            throw new Error(`Cannot compute Hill Sphere, ${minMass} > ${maxMass} , ${this}`);

        this.orbLimitOut.value = orbit_.semimajor_axis.value * Math.cbrt(minMass / (3 * maxMass))

        var rochFractionMass = this.mass.value / 1;
        // var rochFractionDens = this.density.value / 1;
        // if (rochFractionDens != rochFractionMass)
        //     console.warn("Roch fractions should be the same", rochFractionDens, rochFractionMass, this);


        this.orbLimitIn.value = this.radius.value * Math.pow(2 * rochFractionMass, 1 / 3)

        // console.log("1111"
        //     , "\t", orbit_.semimajor_axis.km
        //     , "\t", this.orbLimitIn.km
        //     , "\t", this.orbLimitOut.km
        // );

        return this;
    }

    public getMass(): Convert.NumberMass {
        return this.mass;
    }


    public clone() { return new Planet(this.getWorldData()).copyLogic(this) }

}

