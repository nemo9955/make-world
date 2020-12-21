import * as Convert from "../../src/utils/Convert"
// import {Convert} from "../.././src/utils/Convert"

// https://jestjs.io/docs/en/expect



test('Convert 1', () => {
    expect(Convert.kgToSm(1)).toBeCloseTo(5.028992139685286e-31, 8);
    expect(Convert.smToKg(1)).toBe(1.98847e+30);

    expect(Convert.kmToAu(1)).toBeCloseTo(6.684587122671e-9, 8);
    expect(Convert.auToKm(1.0)).toBe(149597870.7);
    // expect(Convert.auToKm(1.0)).toBe(149597870.691); // TODO figure out precision issues

    expect(Convert.kmToSr(1)).toBeCloseTo(0.000001436781609195, 8);
    expect(Convert.srToKm(1)).toBe(696000);

    expect(Convert.auToSr(1)).toBeCloseTo(214.9394693836, 7);
    expect(Convert.srToAu(1)).toBeCloseTo(0.004652472637379, 8);
});





