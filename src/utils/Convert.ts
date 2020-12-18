
import * as THREE from "three";


// import * as Convert from "../utils/Convert"

export function degToRad(degrees: number): number {
    return THREE.MathUtils.degToRad(degrees)
}

export function clamp(value: number, min: number, max: number): number {
    return THREE.MathUtils.clamp(value, min, max)
}


