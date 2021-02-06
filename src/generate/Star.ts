
import { Color } from "../utils/Color"
import * as Random from "../utils/Random"
import * as Units from "../utils/Units"
import * as Convert from "../utils/Convert"
import { Orbit } from "./Orbit";
import { OrbitingElement } from "./OrbitingElement";
import { ObjectPool } from "../utils/ObjectPool";
import { Identifiable } from "../modules/DataBaseManager";
import { orbit_types_, WorldData } from "../modules/WorldData";

// Artifexian : https://www.youtube.com/watch?v=x55nxxaWXAM
// https://en.wikipedia.org/wiki/Stellar_classification

// Class	Effective temperature[1][2]	Vega-relative chromaticity[3][4][a]	Chromaticity (D65)[5][6][3][b]	Main-sequence mass[1][7] (solar masses)	Main-sequence radius[1][7] (solar radii)	Main-sequence luminosity[1][7] (bolometric)	Hydrogen lines	Fraction of all main-sequence stars[8]
// O	≥ 30,000 K	blue	blue	≥ 16 M☉	≥ 6.6 R☉	≥ 30,000 L☉	Weak	~0.00003%
// B	10,000–30,000 K	blue white	deep blue white	2.1–16 M☉	1.8–6.6 R☉	25–30,000 L☉	Medium	0.13%
// A	7,500–10,000 K	white	blue white	1.4–2.1 M☉	1.4–1.8 R☉	5–25 L☉	Strong	0.6%
// F	6,000–7,500 K	yellow white	white	1.04–1.4 M☉	1.15–1.4 R☉	1.5–5 L☉	Medium	3%
// G	5,200–6,000 K	yellow	yellowish white	0.8–1.04 M☉	0.96–1.15 R☉	0.6–1.5 L☉	Weak	7.6%
// K	3,700–5,200 K	light orange	pale yellow orange	0.45–0.8 M☉	0.7–0.96 R☉	0.08–0.6 L☉	Very weak	12.1%
// M	2,400–3,700 K	orange red	light orange red	0.08–0.45 M☉	≤ 0.7 R☉	≤ 0.08 L☉	Very weak	76.45%

export class Star extends OrbitingElement {
    sclass: string;
    luminosity = new Convert.NumberRadiantFlux();
    temperature = new Convert.NumberTemperature();
    lifetime = new Convert.NumberTime();

    color: Color;


    radius = new Convert.NumberLength();
    mass = new Convert.NumberMass();




    constructor(worldData: WorldData) {
        super(worldData);
        this.type = this.constructor.name;

        this.color = new Color();
    }


    public getMass(): Convert.NumberMass {
        return this.mass;
    }

    private setFromMass(mass?: number) {
        if (mass) this.mass.sm = mass;

        this.luminosity.watt = Math.pow(mass, 3);
        this.radius.sr = Math.pow(mass, 0.74);
        this.temperature.kelvin = Math.pow(mass, 0.505);
        this.lifetime.universal = Math.pow(mass, -2.5);
    }

    public makeClassO(mass?: number) {
        this.sclass = "O";
        this.color.set_color("#92B5FF")
        this.mass.sm = (mass ? mass : Random.random_float_clamp(16, 100));
        this.setFromMass(this.mass.sm);
        return this;
    }

    public makeClassB(mass?: number) {
        this.sclass = "B";
        this.color.set_color("#A2C0FF")
        this.mass.sm = (mass ? mass : Random.random_float_clamp(2.1, 16));
        this.setFromMass(this.mass.sm);
        return this;
    }

    public makeClassA(mass?: number) {
        this.sclass = "A";
        this.color.set_color("#D5E0FF")
        this.mass.sm = (mass ? mass : Random.random_float_clamp(1.4, 2.1));
        this.setFromMass(this.mass.sm);
        return this;
    }

    public makeClassF(mass?: number) {
        this.sclass = "F";
        this.color.set_color("#F9F5FF")
        this.mass.sm = (mass ? mass : Random.random_float_clamp(1.04, 1.4));
        this.setFromMass(this.mass.sm);
        return this;
    }

    public makeClassG(mass?: number) {
        this.sclass = "G";
        this.color.set_color("#FFEDE3")
        this.mass.sm = (mass ? mass : Random.random_float_clamp(0.8, 1.04));
        this.setFromMass(this.mass.sm);
        return this;
    }

    public makeClassK(mass?: number) {
        this.sclass = "K";
        this.color.set_color("#FFDAB5")
        this.mass.sm = (mass ? mass : Random.random_float_clamp(0.45, 0.8));
        this.setFromMass(this.mass.sm);
        return this;
    }

    public makeClassHabK(mass?: number) {
        this.sclass = "K";
        this.color.set_color("#FFDAB5")
        this.mass.sm = (mass ? mass : Random.random_float_clamp(0.6, 0.8));
        this.setFromMass(this.mass.sm);
        return this;
    }

    public makeClassM(mass?: number) {
        this.sclass = "M";
        this.color.set_color("#FFB56C")
        this.mass.sm = (mass ? mass : Random.random_float_clamp(0.08, 0.45));
        this.setFromMass(this.mass.sm);
        return this;
    }

    public genAnyStar() {
        const total_percent = 76.45 + 12.1 + 7.6 + 3 + 0.6 + 0.13 + 0.00003;
        const rnd_percent = Math.random() * total_percent;
        var sum_percent = 0;

        sum_percent += 76.45
        if (rnd_percent < sum_percent)
            return this.makeClassM();

        sum_percent += 12.1
        if (rnd_percent < sum_percent)
            return this.makeClassK();

        sum_percent += 7.6
        if (rnd_percent < sum_percent)
            return this.makeClassG();

        sum_percent += 3
        if (rnd_percent < sum_percent)
            return this.makeClassF();

        sum_percent += 0.6
        if (rnd_percent < sum_percent)
            return this.makeClassA();

        sum_percent += 0.13
        if (rnd_percent < sum_percent)
            return this.makeClassB();

        sum_percent += 0.00003
        if (rnd_percent < sum_percent)
            return this.makeClassO();

        return this.makeClassG(); // Like the Sun
    }

    public genLongLifeStar() {
        const total_percent = 76.45 + 12.1 + 7.6 + 3;
        const rnd_percent = Math.random() * total_percent;
        var sum_percent = 0;

        sum_percent += 76.45
        if (rnd_percent < sum_percent)
            return this.makeClassM();

        sum_percent += 12.1
        if (rnd_percent < sum_percent)
            return this.makeClassK();

        sum_percent += 7.6
        if (rnd_percent < sum_percent)
            return this.makeClassG();

        sum_percent += 3
        if (rnd_percent < sum_percent)
            return this.makeClassF();

        return this.makeClassG(); // Like the Sun
    }

    public genHabitableStar() {
        const total_percent = 12.1 + 7.6 + 3;
        const rnd_percent = Math.random() * total_percent;
        var sum_percent = 0;

        sum_percent += 12.1
        if (rnd_percent < sum_percent)
            return this.makeClassHabK();

        sum_percent += 7.6
        if (rnd_percent < sum_percent)
            return this.makeClassG();

        sum_percent += 3
        if (rnd_percent < sum_percent)
            return this.makeClassF();

        return this.makeClassG(); // Like the Sun
    }

    public clone() { return new Star(this.getWorldData()).copyLogic(this) }
}
