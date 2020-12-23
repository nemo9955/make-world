

import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"


/*

https://www.amsat.org/keplerian-elements-tutorial/
http://www.planetaryorbits.com/kepler-laws-orbital-elements.html
https://jtauber.github.io/orbits/019.html

*/

export class Orbit {

    // public mean_longitude = new Convert.NumberAngle();

    // Right Ascension of Ascending Node
    // RAAN
    // Longitude of Ascending Node
    public longitude_ascending_node = new Convert.NumberAngle();

    // LONGITUDE OF PERIHELION
    // argument of periapsis
    // Argument of Perigee
    public longitude_perihelion = new Convert.NumberAngle();

    // Orbital Inclination
    public inclination = new Convert.NumberAngle();

    // Eccentricity
    // ecce
    private _eccentricity = 0.0;

    // Mean Motion
    // orbit period
    // semimajor-axis
    private _semimajor_axis = new Convert.NumberLength();

    private _semiminor_axis = new Convert.NumberLength();
    private _focal_distance = new Convert.NumberLength();

    public get eccentricity() { return this._eccentricity; }
    public get semimajor_axis() { return this._semimajor_axis; }
    public get semiminor_axis() { return this._semiminor_axis; }
    public get focal_distance() { return this._focal_distance; }

    public set eccentricity(value) {
        this._eccentricity = value;
        this._semiminor_axis.value = this.calc_semiminor_axis()
        this._focal_distance.value = this.calc_focal_distance()
    }
    public set semimajor_axis(value) {
        this._semimajor_axis = value;
        this._semiminor_axis.value = this.calc_semiminor_axis()
        this._focal_distance.value = this.calc_focal_distance()
    }

    random_sane() {
        this.set_major_ecc(
            Random.random_float_clamp(0.5, 30),
            Random.random_float_clamp(0.0001, 0.2)
        )
        this.longitude_perihelion.deg = Random.random_float_clamp(0, 360)
        this.longitude_ascending_node.deg = Random.random_float_clamp(0, 360)

        // afects the "flattness" in plane
        this.inclination.deg = Random.random_float_clamp(0, 5)
        return this;
    }

    copy(source_: Orbit) {
        Convert.copy(this, source_)
        return this;
    }

    set_axis(semimajor: number | Convert.NumberLength, semiminor: number | Convert.NumberLength) {
        this.semimajor_axis.copy(semimajor);
        this.semiminor_axis.copy(semiminor);
        if (this.semimajor_axis.value < this.semiminor_axis.value) {
            console.warn("Major axis is smaller that Minor axis, will switch values !")
            this.semimajor_axis.copy(semiminor);
            this.semiminor_axis.copy(semimajor);
        }
        this.eccentricity = this.calc_eccentricity()
    }


    set_major_ecc(semimajor: number | Convert.NumberLength, eccentricity: number) {
        this.semimajor_axis.copy(semimajor);
        this.eccentricity = eccentricity;
        this.semiminor_axis.value = this.calc_semiminor_axis()
        if (this.semimajor_axis.value < this.semiminor_axis.value) {
            console.error("this.semimajor_axis.value, this.semiminor_axis.value", this.semimajor_axis.value, this.semiminor_axis.value)
            throw new Error("Major axis is smaller that Minor axis!");
        }
    }

    set_minor_ecc(semiminor: number | Convert.NumberLength, eccentricity: number) {
        this.semiminor_axis.copy(semiminor);
        this.eccentricity = eccentricity;
        this.semimajor_axis.value = this.calc_semimajor_axis()
        if (this.semimajor_axis.value < this.semiminor_axis.value) {
            console.error("this.semimajor_axis.value, this.semiminor_axis.value", this.semimajor_axis.value, this.semiminor_axis.value)
            throw new Error("Major axis is smaller that Minor axis!");
        }
    }


    private calc_eccentricity(): number {
        return Math.sqrt(1 - Math.pow((this._semiminor_axis.value / this._semimajor_axis.value), 2));
    }

    private calc_semiminor_axis(): number {
        return Math.sqrt(Math.pow(this._semimajor_axis.value, 2) * (1 - Math.pow(this._eccentricity, 2)));
    }

    private calc_semimajor_axis(): number {
        return Math.sqrt(Math.pow(this._semiminor_axis.value, 2) / (1 - Math.pow(this._eccentricity, 2)));
    }

    private calc_focal_distance(): number {
        return this._semiminor_axis.value * this._eccentricity
    }

}