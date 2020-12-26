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



test('True anomaly 0-1', () => {

    for (let ecc_ = 0; ecc_ < 1; ecc_ += 0.2)
        for (let rev_ = 0; rev_ < 1; rev_ += 0.05) {
            var true_rev = Convert.true_anomaly_rev(rev_, ecc_)
            expect(true_rev).toBeGreaterThanOrEqual(0)
            expect(true_rev).toBeLessThanOrEqual(1)

            if (rev_ == 0.5)
                expect(true_rev).toBeCloseTo(0.5, 5)
            else if (rev_ < 0.5)
                expect(true_rev).toBeLessThan(0.5)
            else
                expect(true_rev).toBeGreaterThan(0.5)
        }

});

// test('True anomaly print', () => {
//     for (let rev_ = 0; rev_ < 1; rev_ += 0.05) {
//         var true_rev = Convert.true_anomaly_rev(rev_, 0.5)
//         console.log("rev_, true_rev", rev_.toFixed(4), true_rev.toFixed(4));
//     }
// });

test('True anomaly samples', () => {
    var samples = [
        [0, 0, 0.1],
        [0, 0, 0.5],
        [0, 0, 0.9],
        [0.5, 0.5, 0.1],
        [0.5, 0.5, 0.5],
        [0.5, 0.5, 0.9],
        // does not match this online calculator
        // https://www.vcalc.com/wiki/MichaelBartmess/True+Anomaly%2C+%60nu%60%5BE%5D
        // [0.1, 0.109771718938396, 0.1],
        // [0.1, 0.163165704144225, 0.5],
        // [0.1, 0.304307049947232, 0.9],
    ]
    for (let index = 0; index < samples.length; index++) {
        const [rev_in, rev_out, ecc_in] = samples[index];
        var true_rev = Convert.true_anomaly_rev(rev_in, ecc_in)
        expect(true_rev).toBe(rev_out)
    }

});



test('NumberAngle 1', () => {
    var ang = new Convert.NumberAngle(0)
    expect(ang.deg).toBeCloseTo(0, 8);
    expect(ang.rev).toBeCloseTo(0, 8);
    expect(ang.rad).toBeCloseTo(0, 8);

    ang.deg += 90
    expect(ang.deg).toBeCloseTo(90, 8);
    expect(ang.rev).toBeCloseTo(0.25, 8);
    expect(ang.rad).toBeCloseTo(Math.PI / 2, 8);

    ang.rev += 0.25
    expect(ang.deg).toBeCloseTo(180, 8);
    expect(ang.rev).toBeCloseTo(0.5, 8);
    expect(ang.rad).toBeCloseTo(Math.PI / 1, 8);

    ang.rev -= 0.25
    expect(ang.deg).toBeCloseTo(90, 8);
    expect(ang.rev).toBeCloseTo(0.25, 8);
    expect(ang.rad).toBeCloseTo(Math.PI / 2, 8);

    ang.rad += Math.PI
    expect(ang.deg).toBeCloseTo(270, 8);
    expect(ang.rev).toBeCloseTo(0.75, 8);
    expect(ang.rad).toBeCloseTo(Math.PI / 2 * 3, 8);
});



test('Convert angles 1', () => {

    expect(Convert.degToRad(1)).toBeCloseTo(0.0174532925, 8);
    expect(Convert.radToDeg(0.0174532925)).toBeCloseTo(1, 8);

    expect(Convert.degToRad(300)).toBeCloseTo(5.23598776, 8);
    expect(Convert.radToDeg(5.23598776)).toBeCloseTo(300, 5);

    expect(Convert.degToRev(0)).toBeCloseTo(0, 8);
    expect(Convert.revToDeg(0)).toBeCloseTo(0, 8);

    expect(Convert.degToRev(360)).toBeCloseTo(1, 8);
    expect(Convert.revToDeg(1)).toBeCloseTo(360, 8);

    expect(Convert.degToRev(360 * 2)).toBeCloseTo(1 * 2, 8);
    expect(Convert.revToDeg(1 * 2)).toBeCloseTo(360 * 2, 8);

    expect(Convert.degToRev(360 * 0.5)).toBeCloseTo(1 * 0.5, 8);
    expect(Convert.revToDeg(1 * 0.5)).toBeCloseTo(360 * 0.5, 8);

    expect(Convert.degToRev(360 * -1)).toBeCloseTo(1 * -1, 8);
    expect(Convert.revToDeg(1 * -1)).toBeCloseTo(360 * -1, 8);

});





