

import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";



// TODO Make Convert.Number* types read-only to make life simpler
// So no getters and setters are needed which complicates things

// TODO Make Orbits and similar data-driven
// have the data in the object and the functions as static ones that accept as paramt the data structure
// skip the need to instantiate objects that will be in a high number

/*
https://www.amsat.org/keplerian-elements-tutorial/
http://www.planetaryorbits.com/kepler-laws-orbital-elements.html
https://jtauber.github.io/orbits/019.html

*/

export interface OrbitingElement {
    readonly mean_longitude: Convert.NumberAngle;
    readonly longitude_ascending_node: Convert.NumberAngle;
    readonly argument_of_perihelion: Convert.NumberAngle;
    readonly inclination: Convert.NumberAngle;
    readonly semimajor_axis: Convert.NumberLength;
    readonly semiminor_axis: Convert.NumberLength;
    readonly focal_distance: Convert.NumberLength;

    readonly eccentricity: number;
    readonly satelites: OrbitingElement[];
    readonly orbit: Orbit;
    readonly type: string;

    free(): void;
    addSat(sat_: OrbitingElement): void;
    clearSatelites(): void;

}


export class Orbit implements OrbitingElement {

    public id: number = null;
    type: string = null;
    public used_by: number = null;
    depth: number = 0;



    public readonly mean_longitude = new Convert.NumberAngle();


    // Right Ascension of Ascending Node
    // RAAN
    // Longitude of Ascending Node
    // Ω, longitude of ascending node
    // Rotation of the PLANE of the orbit
    public readonly longitude_ascending_node = new Convert.NumberAngle();

    // LONGITUDE OF PERIHELION
    // argument of periapsis
    // Argument of Perigee
    // ω, argument of perihelion
    // Rotation of the orbit inside the plane
    public readonly argument_of_perihelion = new Convert.NumberAngle();

    // Orbital Inclination
    // i, inclination
    // How tilted the plan of orbit is compared to "horizontal"
    public readonly inclination = new Convert.NumberAngle();

    // Eccentricity
    // ecce
    public _eccentricity = 0.00001;
    public get eccentricity() { return this._eccentricity; }
    public set eccentricity(value) {
        this._eccentricity = value;
        this.semiminor_axis.value = this.calc_semiminor_axis()
        this.focal_distance.value = this.calc_focal_distance()
    }

    // Mean Motion
    // orbit period
    // semimajor-axis
    public readonly semimajor_axis = new Convert.NumberLength();

    public readonly semiminor_axis = new Convert.NumberLength();
    public readonly focal_distance = new Convert.NumberLength();

    // public get semimajor_axis() { return this.semimajor_axis; }
    // public get semiminor_axis() { return this.semiminor_axis; }
    // public get focal_distance() { return this.focal_distance; }

    // public set semimajor_axis(value) {
    //     this.semimajor_axis.copy(value);
    //     this.semiminor_axis.value = this.calc_semiminor_axis()
    //     this.focal_distance.value = this.calc_focal_distance()
    // }

    public satelites: Array<OrbitingElement> = null;



    static orbit_types_ = {}
    public get orbit() { return this; }


    constructor() {
        this.id = Math.ceil(Math.random() * 100000) + 10000
        this.satelites = new Array<any>();
        // console.log("this.constructor", this.constructor);
        this.type = this.constructor.name;
    }

    public addSat(sat_: OrbitingElement) {
        sat_.orbit.depth = this.depth + 1
        this.satelites.push(sat_)
    }


    public updateMajEcc() {
        this.semiminor_axis.value = this.calc_semiminor_axis()
        this.focal_distance.value = this.calc_focal_distance()
    }


    public randomUniform() {
        this.set_major_ecc(1, 0.1)
        this.argument_of_perihelion.deg = 0
        this.longitude_ascending_node.deg = 0
        this.inclination.deg = 0

        this.updateMajEcc()
        return this;
    }

    public randomSane() {
        this.set_major_ecc(
            Random.random_float_clamp(0.5, 30),
            Random.random_float_clamp(0.01, 0.2)
        )

        this.argument_of_perihelion.deg = Random.random_float_clamp(0, 360)
        this.longitude_ascending_node.deg = Random.random_float_clamp(0, 360)
        this.inclination.deg = Random.random_float_clamp(0, 5)


        // this.inclination.deg = 5
        // this.eccentricity = 0.001


        this.updateMajEcc()
        return this;
    }

    public set_axis(semimajor: number | Convert.NumberLength, semiminor: number | Convert.NumberLength) {
        this.semimajor_axis.copy(semimajor);
        this.semiminor_axis.copy(semiminor);
        if (this.semimajor_axis.value < this.semiminor_axis.value) {
            console.warn("Major axis is smaller that Minor axis, will switch values !")
            this.semimajor_axis.copy(semiminor);
            this.semiminor_axis.copy(semimajor);
        }
        this.eccentricity = this.calc_eccentricity()
        this.focal_distance.value = this.calc_focal_distance()
    }


    set_major_ecc(semimajor: number | Convert.NumberLength, eccentricity: number) {
        this.semimajor_axis.copy(semimajor);
        this.eccentricity = eccentricity;
        this.semiminor_axis.value = this.calc_semiminor_axis()
        this.focal_distance.value = this.calc_focal_distance()
        if (this.semimajor_axis.value < this.semiminor_axis.value) {
            console.error("this.semimajor_axis.value, this.semiminor_axis.value", this.semimajor_axis.value, this.semiminor_axis.value)
            throw new Error("Major axis is smaller that Minor axis!");
        }
    }

    set_minor_ecc(semiminor: number | Convert.NumberLength, eccentricity: number) {
        this.semiminor_axis.copy(semiminor);
        this.eccentricity = eccentricity;
        this.semimajor_axis.value = this.calc_semimajor_axis()
        this.focal_distance.value = this.calc_focal_distance()
        if (this.semimajor_axis.value < this.semiminor_axis.value) {
            console.error("this.semimajor_axis.value, this.semiminor_axis.value", this.semimajor_axis.value, this.semiminor_axis.value)
            throw new Error("Major axis is smaller that Minor axis!");
        }
    }


    private calc_eccentricity(): number {
        return Math.sqrt(1 - Math.pow((this.semiminor_axis.value / this.semimajor_axis.value), 2));
    }

    private calc_semiminor_axis(): number {
        return Math.sqrt(Math.pow(this.semimajor_axis.value, 2) * (1 - Math.pow(this._eccentricity, 2)));
    }

    private calc_semimajor_axis(): number {
        return Math.sqrt(Math.pow(this.semiminor_axis.value, 2) / (1 - Math.pow(this._eccentricity, 2)));
    }

    private calc_focal_distance(): number {
        return this.semimajor_axis.value * this._eccentricity
        // return this.semiminor_axis.value * this._eccentricity
    }


    public copyDeep(source_: Orbit) {
        Convert.copyDeep(this, source_)

        this.clearNonStars();
        for (let index = 0; index < source_.satelites.length; index++) {
            const orbit_src_: any = source_.satelites[index]

            var obj_ = Orbit.orbit_types_[orbit_src_.type].new().copyDeep(orbit_src_)
            this.satelites.push(obj_);
        }
        return this;
    }

    public copyShallow(source_: Orbit) {
        Convert.copyShallow(this, source_)
        return this;
    }


    public clearSatelites() {
        while (this.satelites.length > 0)
            this.satelites.pop().free()
    }

    public clearNonStars() {
        var count = 0;
        while (this.satelites.length > count) {
            if (this.satelites[this.satelites.length - 1].type === "Star") {
                count++;
                continue;
            }
            this.satelites.pop().free()
        }
    }


    // GRAVEYARD ZONE :
    public free() {
        return;
        if (this.used_by != null) {
            console.error("Cannot free a used Orbit !!!! ", this, Orbit.pool_);
            return;
        }

        if (this.type != "Orbit") {
            // console.groupCollapsed();
            // console.error("Free not same type ", this);
            console.error("Free not same type ", this, Orbit.pool_);
            // console.trace("Free not same type ", this);
            // console.groupEnd();
            // throw new Error("Free not same type");
            return;
        }
        this.clearNonStars();
        // console.log("free this", this);
        Orbit.pool_.free(this)
    }
    public clone() { return Orbit.clone().copyDeep(this) }
    public static new() { return Orbit.clone() }
    public static clone() {
        // var orb_ = Orbit.pool_.get()
        var orb_ = Orbit.pool_.create() // TODO FIXME ideally to use get //////////////////////////////////////////////////////////
        // console.log("orb_ ", orb_ );
        return orb_
    }
    public static pool_ = new ObjectPool<Orbit>(() => new Orbit(), (item: Orbit) => {
        // console.log("item", item);
        // item.clearNonStars();
        item.depth = 0;
        // Orbit.pool_.free(item)
    }, 0);
}

Orbit.orbit_types_["Orbit"] = Orbit


