
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { Identifiable } from "../modules/DataBaseManager";
import { WorldData } from "../modules/WorldData";
import {  Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";


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

    public compute() {
        // this.orbLimitOut.km = this.semimajor_axis.km * Math.cbrt(this.mass.kg / ( 3* """parent""".mass.kg ))  // TODO FINISH ME !!!!
        return this;
    }



    public clone() { return new Planet(this.getWorldData()).copyLogic(this) }

}

