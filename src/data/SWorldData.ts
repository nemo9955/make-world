
import { PlanetarySystem } from "../generate/PlanetarySystem"

export class SWorldData {

    id: number;
    planetary_system: PlanetarySystem;

    constructor() {
        this.planetary_system = new PlanetarySystem();
    }

    public init() {
        this.id = Math.ceil(Math.random() * 10000) + 1000
        this.planetary_system.genStar()
    }

    public read() {
    }

    public write() {
    }

}