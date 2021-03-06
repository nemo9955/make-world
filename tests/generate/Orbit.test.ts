// import * as Orbit from "../.././src/generate/Orbit"
import { Orbit } from "../.././src/generate/Orbit"
import { Planet } from "../../src/generate/Planet";
import { WorldData } from "../../src/modules/WorldData";

// https://jestjs.io/docs/en/expect


// https://www.omnicalculator.com/math/ellipse
// http://www.ambrsoft.com/TrigoCalc/Circles2/Ellipse/Ellipse.htm

test('Test Ellipse ALT 1-1', () => {
    var wd = new WorldData("test")
    var maj = 1
    var min = 1
    var ecc = 0
    var ell = new Orbit(wd);

    ell.semimajor_axis.km = maj;
    ell.eccentricity = ecc;
    ell.updateMajEcc();
    expect(ell.semiminor_axis.km).toBeCloseTo(min);
});

test('Test Ellipse ALT 2-1', () => {
    var wd = new WorldData("test")
    var maj = 2
    var min = 1
    var ecc = 0.8660254037844386
    var ell = new Orbit(wd);

    ell.semimajor_axis.km = maj;
    ell.eccentricity = ecc;
    ell.updateMajEcc();
    expect(ell.semiminor_axis.km).toBeCloseTo(min);
    expect(ell.focal_distance.km).toBeCloseTo(1.73205080, 5);
});

test('Test Ellipse 1-1', () => {
    var wd = new WorldData("test")
    var maj = 1
    var min = 1
    var ecc = 0
    var ell = new Orbit(wd);
    ell.set_axis(maj, min); expect(ell.eccentricity).toBeCloseTo(ecc);
    ell.set_major_ecc(maj, ecc); expect(ell.semiminor_axis.km).toBeCloseTo(min);
    ell.set_minor_ecc(min, ecc); expect(ell.semimajor_axis.km).toBeCloseTo(maj);
});

test('Test Ellipse 2-1', () => {
    var wd = new WorldData("test")
    var maj = 2
    var min = 1
    var ecc = 0.8660254037844386
    var ell = new Orbit(wd);

    ell.set_axis(maj, min);
    expect(ell.eccentricity).toBeCloseTo(ecc);
    expect(ell.focal_distance.km).toBeCloseTo(1.73205080, 5);

    ell.set_major_ecc(maj, ecc);
    expect(ell.semiminor_axis.km).toBeCloseTo(min);
    expect(ell.focal_distance.km).toBeCloseTo(1.73205080, 5);

    ell.set_minor_ecc(min, ecc);
    expect(ell.semimajor_axis.km).toBeCloseTo(maj);
    expect(ell.focal_distance.km).toBeCloseTo(1.73205080, 5);
});

test('Test Ellipse 845-159', () => {
    var wd = new WorldData("test")
    var maj = 845
    var min = 159
    var ecc = 0.9821373003261777
    var ell = new Orbit(wd);


    ell.set_axis(maj, min);
    expect(ell.eccentricity).toBeCloseTo(ecc);
    expect(ell.focal_distance.km).toBeCloseTo(829.9060187756202, 5);

    ell.set_major_ecc(maj, ecc);
    expect(ell.semiminor_axis.km).toBeCloseTo(min);
    expect(ell.focal_distance.km).toBeCloseTo(829.9060187756202, 5);

    ell.set_minor_ecc(min, ecc);
    expect(ell.semimajor_axis.km).toBeCloseTo(maj);
    expect(ell.focal_distance.km).toBeCloseTo(829.9060187756202, 5);
});


// test('Test Ellipse 159-845', () => {
//     var maj = 159
//     var min = 845
//     var ecc = 0.9821373003261777
//     var ell = new Orbit();
//     ell.set_axis(maj, min); expect(ell.eccentricity).toBeCloseTo(ecc);
//     ell.set_major_ecc(maj, ecc); expect(ell.semiminor_axis.km).toBeCloseTo(min);
//     ell.set_minor_ecc(min, ecc); expect(ell.semimajor_axis.km).toBeCloseTo(maj);
// });




test('Copy 1', () => {
    var wd = new WorldData("test")
    var orig_ = new Orbit(wd);
    var copy = new Orbit(wd).copyDeep(orig_);

    expect(orig_).toMatchObject(copy)
});


test('Copy 2', () => {
    var wd = new WorldData("test")
    var orig_ = new Orbit(wd);

    var test_orb_ = new Orbit(wd).randomUniform();
    test_orb_.semimajor_axis.div(1)
    orig_.addSat(test_orb_)

    var copy_ = new Orbit(wd).copyDeep(orig_);

    expect(orig_).toMatchObject(copy_)
    expect(copy_).toMatchObject(orig_)
});

test('Copy 3', () => {
    var wd = new WorldData("test")
    var orig_ = new Orbit(wd);

    var test_pl_ = new Planet(wd)
    test_pl_.radius.km = 1000
    test_pl_.mass.kg = 1000
    orig_.addSat(test_pl_)

    var copy_ = new Orbit(wd).copyDeep(orig_);

    expect(orig_).toMatchObject(copy_)
    expect(copy_).toMatchObject(orig_)

    expect((copy_.getSats()[0] as Planet).radius.km).toBeCloseTo(1000)
    expect((copy_.getSats()[0] as Planet).mass.kg).toBeCloseTo(1000)
});

