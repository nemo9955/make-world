

import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { ObjectPool } from "../utils/ObjectPool";
import { WorldData } from "../modules/WorldData";
import { OrbitingElement } from "./OrbitingElement";
import type { PlanetarySystem } from "./PlanetarySystem";



/*
https://www.amsat.org/keplerian-elements-tutorial/
http://www.planetaryorbits.com/kepler-laws-orbital-elements.html
https://jtauber.github.io/orbits/019.html

mean distance :
    https://www.jstor.org/stable/2689506?seq=1
    http://www.planetaryorbits.com/kepler-laws-orbital-elements.html
    https://en.wikipedia.org/wiki/Kepler%27s_laws_of_planetary_motion#Third_law

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
    public readonly perimeter = new Convert.NumberLength();
    public readonly orbitalPeriod = new Convert.NumberTime();

    constructor(worldData: WorldData) {
        super(worldData);
        this.type = this.constructor.name;

        this.satelites = new Array<number>();
        // console.log("this.constructor", this.constructor);
    }

    public calcPerimeter1() {
        // https://www.geeksforgeeks.org/perimeter-of-an-ellipse/
        return 2 * Math.PI * Math.sqrt((Math.pow(this.semimajor_axis.value, 2) + Math.pow(this.semiminor_axis.value, 2)) / 2)
    }

    public calcPerimeter2() {
        // apr 2 https://www.mathsisfun.com/geometry/ellipse-perimeter.html
        return Math.PI * (
            (3 * (this.semimajor_axis.value + this.semiminor_axis.value))
            - Math.sqrt(
                ((3 * this.semimajor_axis.value) + this.semiminor_axis.value)
                * (this.semimajor_axis.value + (3 * this.semiminor_axis.value))
            )
        )
    }

    public calcPerimeter3() {
        // apr 3 https://www.mathsisfun.com/geometry/ellipse-perimeter.html
        var hhh = Math.pow(this.semimajor_axis.value - this.semiminor_axis.value, 2)
            / Math.pow(this.semimajor_axis.value + this.semiminor_axis.value, 2);
        return Math.PI
            * (this.semimajor_axis.value + this.semiminor_axis.value)
            * (1 + (
                (3 * hhh)
                / (10 + Math.sqrt(4 - (3 * hhh)))
            ))
    }

    public calcOrbitalPeriod() {
        // T ² = a ³
        // orbital period of a planet (T)
        // mean distance of the planet to the sun (a)
        return Math.sqrt(Math.pow(this.semimajor_axis.au, 3))
    }

    public updateMajEcc() {
        this.semiminor_axis.value = this.calc_semiminor_axis();
        this.focal_distance.value = this.calc_focal_distance();
        this.perimeter.value = (this.calcPerimeter1() + this.calcPerimeter2() + this.calcPerimeter3()) / 3;
        this.orbitalPeriod.ey = this.calcOrbitalPeriod();
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
            Random.randClampFloat(0.5, 30),
            Random.randClampFloat(0.01, 0.2)
        )

        this.argument_of_perihelion.deg = Random.randClampFloat(0, 360)
        this.longitude_ascending_node.deg = Random.randClampFloat(0, 360)
        this.inclination.deg = Random.randClampFloat(0, 5)


        // this.inclination.deg = 5
        // this.eccentricity = 0.001


        this.updateMajEcc()
        return this;
    }

    public randomForMainOrbit(smajax: Convert.NumberLength, plsys: PlanetarySystem) {
        var ecc_ = Random.randClampFloat(0.01, 0.2);
        this.inclination.deg = Random.randClampFloat(0, 5)

        if (plsys.hab_zone_in.value <= smajax.value)
            if (smajax.value <= plsys.hab_zone_out.value)
                ecc_ = Random.randClampFloat(0.01, 0.02);

        if (smajax.value >= plsys.frost_line.value) {
            ecc_ = Random.randClampFloat(0.1, 0.2);
            this.inclination.deg = Random.randClampFloat(5, 10)
        }

        if (smajax.value >= plsys.orbits_limit_out.value * 0.7) {
            ecc_ = Random.randClampFloat(0.3, 0.4);
            this.inclination.deg = Random.randClampFloat(5, 20)
        }

        this.set_major_ecc(smajax, ecc_)

        this.argument_of_perihelion.deg = Random.randClampFloat(0, 360)
        this.longitude_ascending_node.deg = Random.randClampFloat(0, 360)

        this.updateMajEcc()
        return this;
    }



    public randomForClusters(clusterSize: number, smajax: Convert.NumberLength, plsys: PlanetarySystem) {
        this.argument_of_perihelion.deg = Random.randClampFloat(0, 360)
        this.longitude_ascending_node.deg = Random.randClampFloat(0, 360)

        this.inclination.deg = Random.randClampFloat(5, 6)
        var ecc_ = Random.randClampFloat(0.01, 0.05);
        var orbitSize = smajax.clone().div(Random.randClampFloat(60, 70)).mul(clusterSize)

        this.set_major_ecc(orbitSize, ecc_)
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
        this.perimeter.value = (this.calcPerimeter1() + this.calcPerimeter2() + this.calcPerimeter3()) / 3;
        this.orbitalPeriod.ey = this.calcOrbitalPeriod();
    }


    set_major_ecc(semimajor: number | Convert.NumberLength, eccentricity: number) {
        this.semimajor_axis.copy(semimajor);
        this.eccentricity = eccentricity;
        this.semiminor_axis.value = this.calc_semiminor_axis()
        this.focal_distance.value = this.calc_focal_distance()
        this.perimeter.value = (this.calcPerimeter1() + this.calcPerimeter2() + this.calcPerimeter3()) / 3;
        this.orbitalPeriod.ey = this.calcOrbitalPeriod();
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
        this.perimeter.value = (this.calcPerimeter1() + this.calcPerimeter2() + this.calcPerimeter3()) / 3;
        this.orbitalPeriod.ey = this.calcOrbitalPeriod();
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
    public static clone(worldData: WorldData, data_: any) { return new Orbit(worldData).copyDeep(data_) }
    static get type() { return `Orbit` }


    // public guiSelect(slectPane: Tweakpane, gui: WorldGui) {
    //     slectPane.addMonitor(this, "isInHabZone");
    //     slectPane.addMonitor(this, "eccentricity");
    //     slectPane.addMonitor(this.semimajor_axis, 'Gm', { label: "semimajor axis Gm" });
    //     slectPane.addMonitor(this.orbitalPeriod, 'ey', { label: "orbital Period" });
    //     super.guiSelect(slectPane, gui);
    // }

}


