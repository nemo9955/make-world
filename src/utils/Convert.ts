
import * as THREE from "three";

import * as Units from "../utils/Units"

// import * as Convert from "../utils/Convert"



export function kgToSm(from: number): number {
    return from / Units.SOLAR_MASS_KG;
}
export function smToKg(from: number): number {
    return from * Units.SOLAR_MASS_KG;
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

export function clamp(value: number, min: number, max: number): number {
    return THREE.MathUtils.clamp(value, min, max)
}


export class NumberKm {
    value: number = 0
    public get km(): number { return this.value; }
    public set km(value: number) { this.value = value; }
    public get au(): number { return kmToAu(this.value); }
    public set au(value: number) { this.value = auToKm(value); }
    public get sr(): number { return kmToSr(this.value); }
    public set sr(value: number) { this.value = srToKm(value); }
}

export class NumberKg {
    value: number = 0
    public get kg(): number { return this.value; }
    public set kg(value: number) { this.value = value; }
    public get sm(): number { return kgToSm(this.value); }
    public set sm(value: number) { this.value = smToKg(value); }
}

export class NumberAngle {
    value: number = 0
    public get deg(): number { return this.value; }
    public set deg(value: number) { this.value = value; }
    public get rad(): number { return degToRad(this.value); }
    public set rad(value: number) { this.value = radToDeg(value); }
}



// interface Number {
//     toPowerOf10: () => string;
// }
// Number.prototype
// (Number as any).prototype.toPowerOf10 = function (): string {
//     return this.toExponential();
// }

// console.log("(5 as Number).toExponential(5)", (5 as Number).toExponential(5));



// public add_converter_accessors_length(var_name: string, base_unit = "km") {
//     var units = ["km", "au", "sr"]
//     for (let index = 0; index < units.length; index++) {
//         const unit = units[index];
//         var key = var_name.substr(1, var_name.length) + "_" + unit

//         if (unit === base_unit)
//             Object.defineProperty(this, key, {
//                 get: () => { return this[var_name]; },
//                 set: (value: any) => { this[var_name] = value; },
//             });
//         else
//             Object.defineProperty(this, key, {
//                 get: () => { return this[var_name]; },
//                 set: (value: any) => { this[var_name] = value; },
//             });

//     }

// }

