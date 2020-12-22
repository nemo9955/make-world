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

