
import * as THREE from "three";

import * as Units from "../utils/Units"
import { ActionsManager } from "./Actions";

// import * as Convert from "../utils/Convert"



export function kgToSm(from: number): number {
    return from / Units.SOLAR_MASS_KG;
}
export function smToKg(from: number): number {
    return from * Units.SOLAR_MASS_KG;
}


export function kgToEm(from: number): number {
    return from / Units.EARTH_MASS_KG;
}
export function emToKg(from: number): number {
    return from * Units.EARTH_MASS_KG;
}


export function kmToAu(from: number): number {
    return from / Units.ASTRONOMICAL_UNIT_KM;
}
export function auToKm(from: number): number {
    return from * Units.ASTRONOMICAL_UNIT_KM;
}

export function kmToSr(from: number): number {
    return from / Units.SOLAR_RADIUS_KM;
}
export function srToKm(from: number): number {
    return from * Units.SOLAR_RADIUS_KM;
}

export function kmToEr(from: number): number {
    return from / Units.EARTH_RADIUS_KM;
}
export function erToKm(from: number): number {
    return from * Units.EARTH_RADIUS_KM;
}

export function kmToJupr(from: number): number {
    return from / Units.JUPITER_RADIUS_KM;
}
export function juprToKm(from: number): number {
    return from * Units.JUPITER_RADIUS_KM;
}

export function kgToJupm(from: number): number {
    return from / Units.JUPITER_MASS_KG;
}
export function jupmToKg(from: number): number {
    return from * Units.JUPITER_MASS_KG;
}

export function jupEarthMass(from: number): number {
    return from * Units.JUPITER_TO_EARTH_MASS;
}
export function earthJupMass(from: number): number {
    return from / Units.JUPITER_TO_EARTH_MASS;
}


export function auToSr(from: number): number {
    return from * Units.AU_TO_SR;
}
export function srToAu(from: number): number {
    return from / Units.AU_TO_SR;
}

export function degToRad(degrees: number): number {
    return THREE.MathUtils.degToRad(degrees)
}

export function radToDeg(radians: number): number {
    return THREE.MathUtils.radToDeg(radians)
}

export function revToRad(revolutions: number): number {
    return THREE.MathUtils.degToRad(revolutions * 360)
}

export function radToRev(radians: number): number {
    return THREE.MathUtils.radToDeg(radians) / 360
}

export function degToRev(degrees: number): number {
    return degrees / 360
}

export function revToDeg(revolutions: number): number {
    return revolutions * 360
}

export function clamp(value: number, min: number, max: number): number {
    return THREE.MathUtils.clamp(value, min, max)
}

export function copy(target_: any, source_: any) { copyDeep(target_, source_) }

export function sphereVolume(radius: number) {
    return 4 * Math.PI * radius * radius
}


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object

export function copyShallow(target_: any, source_: any, skipId = false) {
    for (const key in source_) {
        // if (key.startsWith("__") && key.endsWith("__")) continue;
        if (skipId && key === "id") continue;
        if (source_[key]?.__proto__.constructor.name === "Array") {
            for (const ar_key in target_[key])
                if (typeof target_?.[key]?.[ar_key]?.['copyShallow'] === "function")
                    copyShallow(target_[key][ar_key], source_[key][ar_key])
                else if (typeof target_?.[key]?.[ar_key]?.['copy'] === "function")
                    target_[key]['copy'](source_[key]);
        } else if (typeof target_?.[key]?.['copyShallow'] === "function") {
            target_[key]['copyShallow'](source_[key]);
            // } else if (typeof target_?.[key]?.['copy'] === "function") {
            //     target_[key]['copy'](source_[key]);
        } else if (typeof source_?.[key] === "function") {
            continue; // don't copy functions
        } else {
            target_[key] = source_[key];
        }
    }
}

const BASIC_OBJECTS = ["number", "boolean", "string"]

export function copyDeep(target_: any, source_: any, skipId = false) {
    for (const key in source_) {
        // if (key.startsWith("__") && key.endsWith("__")) continue;
        if (skipId && key === "id") continue;
        if (source_[key]?.__proto__.constructor.name === "Array") {
            var type_ = typeof source_[key][0] // TODO will cause issues on mixed types arrays
            if (BASIC_OBJECTS.includes(type_)) {
                target_[key] = [...source_[key]] // if it is a basic array , can be copied
            } else {
                continue; // to be done explicitly by the user
            }
            continue; // to be done explicitly by the user
        } else if (typeof target_?.[key]?.['copyDeep'] === "function") {
            target_[key]['copyDeep'](source_[key]);
            // } else if (typeof target_?.[key]?.['copy'] === "function") {
            //     target_[key]['copy'](source_[key]);
        } else if (typeof source_?.[key] === "function") {
            continue; // don't copy functions
        } else {
            target_[key] = source_[key];
        }
    }
}


// export function true_anomaly_rev(rev_: number, ecc: number) {
//     // view-source:https://jtauber.github.io/orbits/030.html
//     // https://www.vcalc.com/wiki/MichaelBartmess/True+Anomaly%2C+%60nu%60%5BE%5D

//     rev_ = revToRad(rev_)

//     var up = Math.cos(rev_) - ecc
//     var down = 1 - (ecc * Math.cos(rev_))
//     var the_rev = Math.acos(up / down)

//     the_rev = radToRev(the_rev)

//     return the_rev
// }

export function true_anomaly_rev(t: number, ecc: number) {
    // view-source:https://jtauber.github.io/orbits/030.html

    // mean anomaly
    var M = 2 * Math.PI * t;

    // calculate eccentric anomaly using Newton-Rhapson
    var E = M;
    var next = 0;
    var count = 0;
    while (count++ < 10) {
        next = E + (M - (E - ecc * Math.sin(E))) / (1 - ecc * Math.cos(E));
        if (Math.abs(next - E) < 1E-6) {
            break;
        }
        E = next;
    }

    // calculate true anomaly
    var theta = 2 * Math.atan2(Math.sqrt(1 - ecc) * Math.cos(E / 2), Math.sqrt(1 + ecc) * Math.sin(E / 2));

    var the_rev = (((theta / Math.PI) * -1) + 1) / 2
    return the_rev
}


// TODO Use ActionsManager to add listeners for NumberConverter value changes

export abstract class NumberConverter {
    // public readonly action = new ActionsManager();

    value: number
    type: String
    constructor(value = null) {
        this.value = value;
        this.type = this.constructor.name
    }

    abstract clone(): any;

    public copyDeep(source_: NumberConverter | number) { this.copy(source_) }
    public copyShallow(source_: NumberConverter | number) { this.copy(source_) }
    public copy(source_: NumberConverter | number) {
        if (typeof (source_ as any)?.value === "number") {
            this.value = (source_ as any).value;
        }
        if (typeof source_ === "number") {
            this.value = source_;
        }
        return this;
    }

    public add(val_: number) { this.value += val_; return this; }
    public sub(val_: number) { this.value -= val_; return this; }
    public mul(val_: number) { this.value *= val_; return this; }
    public div(val_: number) { this.value /= val_; return this; }
}

export class NumberLength extends NumberConverter {
    public clone() { return new NumberLength(this.value); }
    public get km(): number { return this.value; }
    public set km(value: number) { this.value = value; }
    public get Mm(): number { return this.value / 1000; }
    public set Mm(value: number) { this.value = value * 1000; }
    public get Gm(): number { return this.value / 1000000; }
    public set Gm(value: number) { this.value = value * 1000000; }
    public get Tm(): number { return this.value / 1000000000; }
    public set Tm(value: number) { this.value = value * 1000000000; }
    public get Ym(): number { return this.value / Math.pow(10, 21); }
    public set Ym(value: number) { this.value = value * Math.pow(10, 21); }
    public get au(): number { return kmToAu(this.value); }
    public set au(value: number) { this.value = auToKm(value); }
    public get sr(): number { return kmToSr(this.value); }
    public set sr(value: number) { this.value = srToKm(value); }
    public get er(): number { return kmToEr(this.value); }
    public set er(value: number) { this.value = erToKm(value); }
    public get jupr(): number { return kmToJupr(this.value); }
    public set jupr(value: number) { this.value = juprToKm(value); }
}

export class NumberVolume extends NumberConverter {
    public clone() { return new NumberLength(this.value); }
    public get km3(): number { return this.value; }
    public set km3(value: number) { this.value = value; }
    public get m3(): number { return this.value * 1000000000; }
    public set m3(value: number) { this.value = value / 1000000000; }
    public setSphere(radius: NumberLength) { this.km3 = sphereVolume(radius.km) }
}

export class NumberMass extends NumberConverter {
    public clone() { return new NumberMass(this.value); }
    public get kg(): number { return this.value; }
    public set kg(value: number) { this.value = value; }
    public get Yg(): number { return this.value / Math.pow(10, 21); }
    public set Yg(value: number) { this.value = value * Math.pow(10, 21); }
    public get Mg(): number { return this.value / 1000; }
    public set Mg(value: number) { this.value = value * 1000; }
    public get Gg(): number { return this.value / 1000000; }
    public set Gg(value: number) { this.value = value * 1000000; }
    public get Tg(): number { return this.value / 1000000000; }
    public set Tg(value: number) { this.value = value * 1000000000; }
    // public get Xg(): number { return this.value / Math.pow(10, 27); }
    // public set Xg(value: number) { this.value = value * Math.pow(10, 27); }
    public get sm(): number { return kgToSm(this.value); }
    public set sm(value: number) { this.value = smToKg(value); }
    public get em(): number { return kgToEm(this.value); }
    public set em(value: number) { this.value = emToKg(value); }
    public get jupm(): number { return kgToJupm(this.value); }
    public set jupm(value: number) { this.value = jupmToKg(value); }
}

export class NumberBigMass extends NumberConverter {
    // https://en.wikipedia.org/wiki/Metric_prefix#List_of_SI_prefixes
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
    // 900 719 925 4 7 4  0 9 9  1
    // 123 456 789 101112 131415 16
    public clone() { return new NumberBigMass(this.value); }
    public get Yg(): number { return this.value; }
    public set Yg(value: number) { this.value = value; }
    public get kg(): number { return this.value * Math.pow(10, 21); }
    public set kg(value: number) { this.value = value / Math.pow(10, 21); }
    public get sm(): number { return this.value / Units.SOLAR_MASS_YG; }
    public set sm(value: number) { this.value = value * Units.SOLAR_MASS_YG; }
    public get em(): number { return this.value / Units.EARTH_MASS_YG; }
    public set em(value: number) { this.value = value * Units.EARTH_MASS_YG; }
    public get jupm(): number { return this.value / Units.JUPITER_MASS_YG; }
    public set jupm(value: number) { this.value = value * Units.JUPITER_MASS_YG; }
}

export class NumberDensity extends NumberConverter {
    public clone() { return new NumberDensity(this.value); }
    public get si(): number { return this.value; }
    public set si(value: number) { this.value = value; }
    public setSiVolumeKilo(mass: NumberMass | NumberBigMass, volume: NumberVolume) { this.si = mass.kg / volume.m3 }
    public setSiRadiusKilo(mass: NumberMass | NumberBigMass, radius: NumberLength) { this.si = mass.kg / sphereVolume(radius.km) }
    public setSiRadiusYotta(mass: NumberMass | NumberBigMass, radius: NumberLength) { this.si = mass.Yg / sphereVolume(radius.Ym) }
    public setSiRadiusArtifexian(mass: NumberMass | NumberBigMass, radius: NumberLength) { this.si = mass.kg / Math.pow(radius.km, 3) }
}

export class NumberAngle extends NumberConverter {
    public clone() { return new NumberAngle(this.value); }
    public get deg(): number { return this.value; }
    public set deg(value: number) { this.value = value; }
    public get rad(): number { return degToRad(this.value); }
    public set rad(value: number) { this.value = radToDeg(value); }
    public get rev(): number { return degToRev(this.value); }
    public set rev(value: number) { this.value = revToDeg(value); }
}

export class NumberTime extends NumberConverter {
    public clone() { return new NumberTime(this.value); }
    public get ey(): number { return this.value; } // earth years
    public set ey(value: number) { this.value = value; } // earth years
    public get eby(): number { return this.value / Math.pow(10, 9); } // earth billion years
    public set eby(value: number) { this.value = value * Math.pow(10, 9); } // earth billion years
}


export class NumberTemperature extends NumberConverter {
    public clone() { return new NumberTemperature(this.value); }
    public get kelvin(): number { return this.value; }
    public set kelvin(value: number) { this.value = value; }
    public get celsius(): number { return this.value - 273.15; }
    public set celsius(value: number) { this.value = value + 273.15; }
}


export class NumberRadiantFlux extends NumberConverter {
    public clone() { return new NumberRadiantFlux(this.value); }
    public get watt(): number { return this.value; }
    public set watt(value: number) { this.value = value; }
}


