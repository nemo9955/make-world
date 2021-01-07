
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { Orbit } from "./Orbit";
import { ObjectPool } from "../utils/ObjectPool";


// TODO more proper and complex planets and moons generation
// https://youtu.be/t6i6TPsqvaM?t=257
// https://www.youtube.com/watch?v=Evq7n2cCTlg&ab_channel=Artifexian


export class Planet extends Orbit {


    public readonly radius = new Convert.NumberLength();
    public readonly mass = new Convert.NumberMass();

    constructor() {
        super();
        this.radius.value = 1;
        Orbit.orbit_types_["Planet"] = Planet
    }

    public get_radius() {
        return this.radius;
    }


    public clone() { return Planet.clone().copy(this) }
    public free() {
        this.clearSats();
        // console.log("this.radius.value = 1;", this.radius.value);
        this.radius.value = 1;
        Planet.pool_.free(this)
    }

    public static clone() { return Planet.pool_.get() }
    public static new() { return Planet.clone() }

    public static pool_ = new ObjectPool<Planet>(() => new Planet(), (item: Planet) => {
        // console.log("item.radius.value = 1;", item.radius.value);
        item.radius.value = 1;
    }, 12);



}

