// import * as Star from "../../src/generate/Star"
import { Star } from "../../src/generate/Star"
import { WorldData } from "../../src/modules/WorldData";

// https://jestjs.io/docs/en/expect


test('Test Star class G', () => {
    var wd = new WorldData("test")
    var star = new Star(wd).makeClassG(1);
    expect(star.sclass).toBe("G");
    expect(star.mass.sm).toBe(1);
    expect(star.radius.sr).toBe(1);
    // expect(star.diameter.sr).toBe(2);
    expect(star.radius.sr).toBe(1);
    expect(star.luminosity.watt).toBe(1);
    expect(star.temperature.kelvin).toBe(1);
    expect(star.lifetime.eby).toBe(10);
});