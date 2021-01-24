
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { OrbitingElement, Orbit } from "./Orbit";
import { ObjectPool } from "../utils/ObjectPool";
import { Identifiable } from "../modules/DataBaseManager";
import { WorldData } from "../modules/WorldData";


// TODO more proper and complex planets and moons generation
// https://youtu.be/t6i6TPsqvaM?t=257
// https://www.youtube.com/watch?v=Evq7n2cCTlg&ab_channel=Artifexian

// TODO generate some predefined planet compositions
// // random size and composition (water, rock, iron) and get mass and density based on proportions, etc
// TODO calc inner and outer limit

export class Planet implements OrbitingElement, Identifiable {

    public id: number = null;
    type: string = null;

    public readonly radius = new Convert.NumberLength();
    public readonly mass = new Convert.NumberMass();

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


    constructor() {
        this.id = WorldData?.instance?.getFreeID();

        this.type = this.constructor.name;
        this.orbit = Orbit.new();
        // this.orbit.used_by = this;
        this.orbit.used_by = this.id;

        this.radius.value = 1;
    }

    public get_radius() {
        return this.radius;
    }



    public copyDeep(source_: Planet) {
        Convert.copyDeep(this, source_)
        return this;
    }

    public copyShallow(source_: Planet) {
        Convert.copyShallow(this, source_)
        return this;
    }



    public getSats(): OrbitingElement[] {
        var satObjs: OrbitingElement[] = []
        for (const sid of this.satelites)
            satObjs.push(WorldData.instance.stdBObjMap.get(sid))
        return satObjs
    }

    public addSat(sat_: OrbitingElement) { this.orbit.addSat(sat_) }
    public clearSatelites() { this.orbit.clearSatelites() }


    // GRAVEYARD ZONE :
    public free() {
        return;
        if (this.type != "Planet") {
            // console.groupCollapsed();
            // console.error("Free not same type ", this);
            console.error("Free not same type ", this, Planet.pool_);
            // console.trace("Free not same type ", this);
            // console.groupEnd();
            // throw new Error("Free not same type");

            return;
        }
        this.orbit.clearNonStars();
        // console.log("free this", this);
        Planet.pool_.free(this);
    }
    public clone() { return Planet.clone().copyDeep(this) }
    public static clone() {
        // return Planet.pool_.get()
        return Planet.pool_.create() // TODO FIXME ideally to use get //////////////////////////////////////////////////////////
    }
    public static new() { return Planet.clone() }
    public static pool_ = new ObjectPool<Planet>(() => new Planet(), (item: Planet) => {
        // console.log("item.radius.value = 1;", item.radius.value, item.id);
        item.radius.value = 1;
    }, 0);

}

