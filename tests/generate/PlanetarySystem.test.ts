// import * as PlanetarySystem from "../.././src/generate/PlanetarySystem"
import { PlanetarySystem } from "../.././src/generate/PlanetarySystem"
import { SpaceFactory } from "../../src/generate/SpaceFactory";

// https://jestjs.io/docs/en/expect

console.debug = jest.fn() // supress debugg logs
console.time = jest.fn()

test('Sample Habitable', () => {
    var spaceFactory = new SpaceFactory();
    for (let index = 0; index < 100; index++) {
        var system = new PlanetarySystem();
        spaceFactory.genStar(system, system); // empty defaults to habitable
        expect(["F", "G", "K"]).toContain(system.getStars()[0].sclass);

        spaceFactory.genOrbitsSimple(system, system)
        var orbits_dists = system.satelites
        expect(orbits_dists.length).toBeGreaterThanOrEqual(5)
    }
});


test('Clone 1', () => {
    var spaceFactory = new SpaceFactory();
    for (let index = 0; index < 10; index++) {
        var system_orig = new PlanetarySystem();
        spaceFactory.genStar(system_orig, system_orig); // empty defaults to habitable
        spaceFactory.genOrbitsUniform(system_orig, system_orig);

        var system_copy = new PlanetarySystem().copyDeep(system_orig)

        expect(system_copy).toMatchObject(system_orig)
        expect(system_orig).toMatchObject(system_copy)

        expect(system_copy.satelites[0]).toMatchObject(system_orig.satelites[0])
        expect(system_orig.satelites[0]).toMatchObject(system_copy.satelites[0])

        expect(system_orig.satelites[0].satelites.length).toBe(system_copy.satelites[0].satelites.length)
        expect(system_orig.id).toBe(system_copy.id)
        expect(system_orig.hab_zone_in.km).toBe(system_copy.hab_zone_in.km)
        expect(system_orig.orbits_limit_out.km).toBe(system_copy.orbits_limit_out.km)

        // expect(system_orig.satelites[0].diameter.au).toBe(system_copy.satelites[0].diameter.au)
        expect(system_orig.getStars()[0].luminosity).toMatchObject(system_copy.getStars()[0].luminosity)
        expect(system_orig.getStars()[0].mass.kg).toBe(system_copy.getStars()[0].mass.kg)
    }
});

