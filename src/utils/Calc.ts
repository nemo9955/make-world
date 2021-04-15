import { pointGeo } from "./Points";


const pi = Math.PI;
const halfPi = pi / 2;
const degrees = 180 / pi;
const radians = pi / 180;
const atan2 = Math.atan2;
const cos = Math.cos;
const max = Math.max;
const min = Math.min;
const sin = Math.sin;
const sign = Math.sign
const sqrt = Math.sqrt;

function asin(x) {
    return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
}

// Converts 3D Cartesian to spherical coordinates (degrees).
export function spherical(cartesian) {
    return [
        atan2(cartesian[1], cartesian[0]) * degrees,
        asin(max(-1, min(1, cartesian[2]))) * degrees
    ];
}

// Converts spherical coordinates (degrees) to 3D Cartesian.
export function cartesian(coordinates, radius = 1) {
    var lambda = radius * coordinates[0] * radians,
        phi = radius * coordinates[1] * radians,
        cosphi = radius * cos(phi);
    return [cosphi * cos(lambda), cosphi * sin(lambda), sin(phi)];
}



// https://www.movable-type.co.uk/scripts/latlong.html
/**
 * Constrain degrees to range 0..360 (e.g. for bearings); -1 => 359, 361 => 1.
 *
 * @private
 * @param {number} degrees
 * @returns degrees within range 0..360.
 */
export function wrap360(degrees: number) {
    if (0 <= degrees && degrees < 360) return degrees; // avoid rounding due to arithmetic ops if within range
    return (degrees % 360 + 360) % 360; // sawtooth wave p:360, a:360
}

// https://www.movable-type.co.uk/scripts/latlong.html
/**
 * Constrain degrees to range -180..+180 (e.g. for longitude); -181 => 179, 181 => -179.
 *
 * @private
 * @param {number} degrees
 * @returns degrees within range -180..+180.
 */
export function wrap180(degrees: number) {
    if (-180 < degrees && degrees <= 180) return degrees; // avoid rounding due to arithmetic ops if within range
    return (degrees + 540) % 360 - 180; // sawtooth wave p:180, a:±180
}

// https://www.movable-type.co.uk/scripts/latlong.html
/**
 * Constrain degrees to range -90..+90 (e.g. for latitude); -91 => -89, 91 => 89.
 *
 * @private
 * @param {number} degrees
 * @returns degrees within range -90..+90.
 */
export function wrap90(degrees: number) {
    if (-90 <= degrees && degrees <= 90) return degrees; // avoid rounding due to arithmetic ops if within range
    return Math.abs((degrees % 360 + 270) % 360 - 180) - 90; // triangle wave p:360 a:±90 TODO: fix e.g. -315°
}

export function wrapLatLon(latlon: pointGeo): pointGeo {
    var [latitude, longitude] = latlon
    // longitude = wrap90(longitude)
    // latitude = wrap360(latitude)
    if (Math.abs(longitude) >= 90) {
        longitude -= 0.01
        latitude += 180
    }
    longitude = wrap90(longitude)
    latitude = wrap360(latitude)
    return [latitude, longitude]
}