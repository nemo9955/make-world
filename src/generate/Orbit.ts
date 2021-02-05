

import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { Identifiable } from "../modules/DataBaseManager";
import { orbit_types_, WorldData } from "../modules/WorldData";
import { OrbitingElement } from "./OrbitingElement";



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


export class Orbit extends OrbitingElement {

    public readonly mean_longitude = new Convert.NumberAngle(0);


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



    constructor(worldData: WorldData) {
        super(worldData);
        this.satelites = new Array<number>();
        // console.log("this.constructor", this.constructor);
        this.type = this.constructor.name;
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

    public free() { return; }
    public clone() { return new Orbit(this.getWorldData()).copyLogic(this) }
}


