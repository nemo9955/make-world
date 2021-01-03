// import * as Star from "../../src/generate/Star"
import { Star } from "../../src/generate/Star"

// https://jestjs.io/docs/en/expect


test('Test Star class G', () => {
    var star = new Star().makeClassG(1);
    expect(star.sclass).toBe("G");
    expect(star.mass.sm).toBe(1);
    expect(star.radius.sr).toBe(1);
    // expect(star.diameter.sr).toBe(2);
    expect(star.radius.sr).toBe(1);
    expect(star.luminosity).toBe(1);
    expect(star.temperature).toBe(1);
    expect(star.lifetime).toBe(1);
});