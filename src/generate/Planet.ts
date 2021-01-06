
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { Orbit } from "./Orbit";
import { ObjectPool } from "../utils/ObjectPool";


export class Planet extends Orbit {


    public radius = new Convert.NumberLength();
    public mass = new Convert.NumberMass();

    constructor() {
        super();
        Orbit.orbit_types_["Planet"] = Planet
    }

    public get_radius() {
        return this.radius;
    }


    public clone() { return Planet.clone().copy(this) }
    public free() {
        this.clearSats();
        Planet.pool_.free(this)
    }

    public static clone() { return Planet.pool_.get() }
    public static new() { return Planet.clone() }

    public static pool_ = new ObjectPool<Planet>(() => new Planet(), (item: Planet) => { }, 12);



}

