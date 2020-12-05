import * as Units from "../.././src/utils/Units"
// import {Units} from "../.././src/utils/Units"

// https://jestjs.io/docs/en/expect



test('SOLAR_RADIUS value', () => {
    expect(Units.SOLAR_RADIUS).toBe(695700);
});

test('ASTRONOMICAL_UNIT value', () => {
    expect(Units.ASTRONOMICAL_UNIT).toBe(149597870700000);
});

test('SOLAR_MASS value', () => {
    expect(Units.SOLAR_MASS).toBeCloseTo(1.98847e+30, 10);
});

test('SOLAR_DIAMETER value', () => {
    expect(Units.SOLAR_DIAMETER).toBe(1391400);
});

test('SOLAR_DIAMETER double SOLAR_RADIUS ', () => {
    expect(Units.SOLAR_DIAMETER).toBe(Units.SOLAR_RADIUS * 2);
});

test('SOLAR_LUMINOSITY value', () => {
    expect(Units.SOLAR_LUMINOSITY).toBeCloseTo(3.8279999999999994e+26, 10);
});





