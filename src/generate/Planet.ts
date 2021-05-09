
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { WorldData } from "../modules/WorldData";
import { Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";
import { PlanetarySystem } from "./PlanetarySystem";
import { Terrain } from "./Terrain";
import { jguiData } from "../gui/JguiUtils";
import { WorkerEvent } from "../modules/Config";

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
    public readonly mass = new Convert.NumberBigMass();
    public readonly density = new Convert.NumberDensity();

    public readonly color: Color;

    public isMoon?: boolean = false;
    public planetType: string = "UNKNOWN";

    public terrainId: number = null;

    constructor(worldData: WorldData) {
        super(worldData);
        this.type = this.constructor.name;


        this.color = new Color();
        this.radius.value = 1;
        this.mass.value = 1;
        this.density.value = 1;
    }


    public getTerrain(): Terrain {
        if (!this.terrainId) return null;
        return this.getWorldData().getAnyObj(this.terrainId)
    }
    public setTerrain(terr_: Terrain) { this.terrainId = terr_.id; }

    public makeMoon(smajax: Convert.NumberLength, smajaxParent: Convert.NumberLength, plsys: PlanetarySystem) {
        this.color.set_color("DarkGrey")
        this.planetType = "Moon";
        this.isMoon = true;

        // TODO make Major moons and Minor moons and maybe ensure moon is smaller than planet
        this.mass.em = Random.randClampFloat(0.01, 0.02);
        this.radius.er = Random.randClampFloat(0.1, 0.3);
        // this.surfaceGravity = Random.random_float_clamp(0.68,1.5);


        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setMassRadius(this.mass, this.radius);
    }

    public makeEarthLike() {
        this.color.set_color("blue")
        this.planetType = "Normal";

        // ver 1 : https://youtu.be/RxbIoIM_Uck?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=64
        this.mass.em = Random.randClampFloat(0.4, 2.35);
        this.radius.er = Random.randClampFloat(0.78, 1.25);
        // this.surfaceGravity = Random.random_float_clamp(0.68,1.5);

        // ver 2 : https://youtu.be/RxbIoIM_Uck?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=81
        // this.mass.em = Random.random_float_clamp(0.1, 3.5);
        // this.radius.er = Random.random_float_clamp(0.5, 1.5);
        // this.surfaceGravity = Random.random_float_clamp(0.4,1.6);

        // console.log("this.radius.km", this.radius.km, "makeEarthLike");

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        // this.density.setSiRadiusYotta(this.mass, this.radius);
        this.density.setMassRadius(this.mass, this.radius);
        // console.log("this.mass", this.mass);
        // console.log("this.radius", this.radius);
        // console.log("this.density", this.density);
    }


    public makeDwarf() {
        this.color.set_color("MistyRose")
        this.planetType = "Dwarf";

        // https://youtu.be/XEIsZjQ_OdU?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=67
        this.mass.em = Random.randClampFloat(0.0001, 0.1);

        this.radius.er = Random.randClampFloat(0.03, 0.5); // CHECK what is the max

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setMassRadius(this.mass, this.radius);
    }

    public makeGassGiant() {
        this.color.set_color("DarkGoldenRod")
        this.planetType = "GassGiant";

        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=22
        // 13 Jupiter Mass == 13 * 317.8 Earth Mass
        this.mass.jupm = Random.randClampFloat(2, 13);

        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=35
        this.radius.jupr = Random.randClampFloat(0.9, 1.1); // Add SOME wiggle

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setMassRadius(this.mass, this.radius);
    }

    public makePuffyGiantPlanet() {
        this.color.set_color("DarkCyan")
        this.planetType = "PuffyGiantPlanet";

        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=22
        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=98
        this.mass.em = Random.randClampFloat(10, Convert.jupEarthMass(2));

        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=35
        this.radius.jupr = Random.randClampFloat(1, 3); // CHECK what is the max

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setMassRadius(this.mass, this.radius);
    }

    public makeGassDwarf() {
        this.color.set_color("Crimson")
        this.planetType = "GassDwarf";

        // https://youtu.be/80oQBGD7g34?list=PLduA6tsl3gygXJbq_iQ_5h2yri4WL6zsS&t=179
        this.mass.em = Random.randClampFloat(1, 20);

        this.radius.er = Random.randClampFloat(2, 5); // CHECK what is the max

        // this.surfaceGravity = this.mass.em / (this.radius.er * this.radius.er) // calculated
        this.density.setMassRadius(this.mass, this.radius);
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

        if (["all", "hab"].filter(x => tags.includes(x))) {
            picks.push({ min: plsys.hab_zone_in.au, max: plsys.hab_zone_out.au, chance: 1000000, pick: this.makeEarthLike.bind(this) })
            picks.push({ min: minOrb, max: habOrb * 2, chance: 2, pick: this.makeEarthLike.bind(this) })
        }
        if (["all", "nohab"].filter(x => tags.includes(x)))
            picks.push({ min: minOrb, max: frostOrb * 0.6, chance: 3, pick: this.makeDwarf.bind(this) })
        if (["all", "nohab"].filter(x => tags.includes(x)))
            picks.push({ min: minOrb, max: frostOrb * 0.6, chance: 2, pick: this.makePuffyGiantPlanet.bind(this) })
        if (["all", "nohab"].filter(x => tags.includes(x)))
            picks.push({ min: frostOrb * 0.6, max: frostOrb * 2, chance: 1, pick: this.makeGassGiant.bind(this) })
        if (["all", "nohab"].filter(x => tags.includes(x)))
            picks.push({ min: frostOrb, max: maxOrb * 2, chance: 5, pick: this.makeGassGiant.bind(this) })
        if (["all", "nohab"].filter(x => tags.includes(x)))
            picks.push({ min: frostOrb * 0.6, max: maxOrb * 2, chance: 6, pick: this.makeGassDwarf.bind(this) })

        var pickedMake = Random.pickChanceOverlaping(smajax.au, picks)
        return pickedMake.pick();
    }


    public compute() {
        super.compute();
        var orbit_ = this.getDirectOrbit();
        var parentMass = this.getParentMass();
        if (!parentMass) {
            console.warn("this.getParents()", this.getParents());
            console.log("this", this);
            // console.log("this.getWorldData().idObjMap", this.getWorldData().idObjMap);
        }
        parentMass = parentMass.clone();

        var minMass = this.mass.value
        var maxMass = parentMass.value
        if (minMass > maxMass) {
            console.warn(`Illogical Hill Sphere, ${minMass} > ${maxMass} `, this, parentMass);
        }

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

    public getMass(): Convert.NumberBigMass {
        return this.mass;
    }

    // public guiSelect(slectPane: Tweakpane, gui: WorldGui) {
    //     slectPane.addInput(this.color, 'value', { label: "color" })
    //     slectPane.addInput(this.radius, 'km', { label: "radius km" });
    //     slectPane.addInput(this.mass, 'Yg', { label: "mass Yg" });
    //     slectPane.addMonitor(this.orbLimitIn, 'km', { label: "lim in" });
    //     slectPane.addMonitor(this.orbLimitOut, 'km', { label: "lim out" });
    //     slectPane.addMonitor(this.density, 'gcm3', { label: "density" });
    //     slectPane.addMonitor(this, "planetType");
    //     slectPane.addMonitor(this, "isInHabZone");
    //     super.guiSelect(slectPane, gui);
    // }


    public addToJgui(jData: jguiData) {
        jData.jGui.addColor("Color", this.color.getRgb().formatHex())
            .addEventListener(jData.jMng, "input", (event: WorkerEvent) => {
                this.color.set_color(event.data.event.target.valueAsNumber)
            })

        super.addToJgui(jData);
    }


    public clone() { return new Planet(this.getWorldData()).copyLogic(this) }
    public static clone(worldData: WorldData, data_: any) { return new Planet(worldData).copyDeep(data_) }
    static get type() { return `Planet` }

}

