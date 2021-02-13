
/*
* Used to store and send VERRY simple data across the main thread and workers
*/
import * as Convert from "../utils/Convert"


// TODO things to add, with parameters being in SpaceConfig!
// genMainOrbits ... bool ensure_habitable
// // make just the main orbits and add after
// addMoons ... number how_many , bool make_harmonics


export class Config {
    do_draw_loop: boolean = true;
    do_update_loop: boolean = false;
    do_main_loop: boolean = false; // leave false

    follow_pointed_orbit: "none" | "imediate" | "auto" = "auto";

    WorldPlanetarySystemID: number;
    globalIsReady: boolean = false; // global flag for when Tickers can run
    timeUpdSpeed = 0.01;

    genEnsureInHabZone = true;
    genEnsureCenteredInHabZone = true;
    genEnsureMoonInHabZone = true;

    public copy(source_: Config) {
        Convert.copyShallow(this, source_)
    }
}

export enum MessageType {
    Event = "Event",
    Ready = "Ready",
    Play = "Play",
    Pause = "Pause",
    InitWorker = "InitWorker",
    InitCanvas = "InitCanvas",
    RefreshDBDeep = "RefreshDBDeep",
    RefreshDBShallow = "RefreshDBShallow",
    RefreshConfig = "RefreshConfig",
    MakeCanvas = "MakeCanvas",
}
