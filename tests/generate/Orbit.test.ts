// import * as Orbit from "../.././src/generate/Orbit"
import { Orbit } from "../.././src/generate/Orbit"

// https://jestjs.io/docs/en/expect


// https://www.omnicalculator.com/math/ellipse

test('Test Ellipse 1-1', () => {
    var maj = 1
    var min = 1
    var ecc = 0
    var ell = new Orbit();
    ell.set_axis(maj, min); expect(ell.eccentricity).toBeCloseTo(ecc);
    ell.set_major_ecc(maj, ecc); expect(ell.semiminor_axis.value).toBeCloseTo(min);
    ell.set_minor_ecc(min, ecc); expect(ell.semimajor_axis.value).toBeCloseTo(maj);
});

test('Test Ellipse 2-1', () => {
    var maj = 2
    var min = 1
    var ecc = 0.8660254037844386
    var ell = new Orbit();
    ell.set_axis(maj, min); expect(ell.eccentricity).toBeCloseTo(ecc);
    ell.set_major_ecc(maj, ecc); expect(ell.semiminor_axis.value).toBeCloseTo(min);
    ell.set_minor_ecc(min, ecc); expect(ell.semimajor_axis.value).toBeCloseTo(maj);
});

test('Test Ellipse 845-159', () => {
    var maj = 845
    var min = 159
    var ecc = 0.9821373003261777
    var ell = new Orbit();
    ell.set_axis(maj, min); expect(ell.eccentricity).toBeCloseTo(ecc);
    ell.set_major_ecc(maj, ecc); expect(ell.semiminor_axis.value).toBeCloseTo(min);
    ell.set_minor_ecc(min, ecc); expect(ell.semimajor_axis.value).toBeCloseTo(maj);
});


// test('Test Ellipse 159-845', () => {
//     var maj = 159
//     var min = 845
//     var ecc = 0.9821373003261777
//     var ell = new Orbit();
//     ell.set_axis(maj, min); expect(ell.eccentricity).toBeCloseTo(ecc);
//     ell.set_major_ecc(maj, ecc); expect(ell.semiminor_axis.value).toBeCloseTo(min);
//     ell.set_minor_ecc(min, ecc); expect(ell.semimajor_axis.value).toBeCloseTo(maj);
// });

