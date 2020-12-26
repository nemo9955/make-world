// import * as PlanetarySystem from "../.././src/generate/PlanetarySystem"
import { PlanetarySystem } from "../.././src/generate/PlanetarySystem"

// https://jestjs.io/docs/en/expect


test('Sample Habitable', () => {
    for (let index = 0; index < 100; index++) {
        var system = new PlanetarySystem().genStar(); // empty defaults to habitable
        expect(["F", "G", "K"]).toContain(system.star.sclass);

        var orbits_dists = system.genOrbitsSimple().orbits_distances
        expect(orbits_dists.length).toBeGreaterThanOrEqual(5)
    }
});


test('Clone 1', () => {
    for (let index = 0; index < 10; index++) {
        var system_orig = new PlanetarySystem()
        system_orig.genStar(); // empty defaults to habitable
        system_orig.genOrbitsSimple();

        var system_copy = new PlanetarySystem().copy(system_orig)

        expect(system_copy).toMatchObject(system_orig)
        expect(system_orig).toMatchObject(system_copy)

        expect(system_copy.star).toMatchObject(system_orig.star)
        expect(system_orig.star).toMatchObject(system_copy.star)

        expect(system_orig.orbits_distances.length).toBe(system_copy.orbits_distances.length)
        expect(system_orig.id).toBe(system_copy.id)
        expect(system_orig.hab_zone_in.km).toBe(system_copy.hab_zone_in.km)
        expect(system_orig.orbits_limit_out.km).toBe(system_copy.orbits_limit_out.km)

        expect(system_orig.star.diameter.au).toBe(system_copy.star.diameter.au)
        expect(system_orig.star.luminosity).toBe(system_copy.star.luminosity)
        expect(system_orig.star.mass.kg).toBe(system_copy.star.mass.kg)
    }
});

