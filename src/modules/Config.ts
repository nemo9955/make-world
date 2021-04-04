
/*
* Used to store and send VERRY simple data across the main thread and workers
*/
import * as Convert from "../utils/Convert"
import { DrawD3Terrain } from "./DrawD3Terrain";


// TODO things to add, with parameters being in SpaceConfig!
// genMainOrbits ... bool ensure_habitable
// // make just the main orbits and add after
// addMoons ... number how_many , bool make_harmonics


export class Config {
    do_draw_loop: boolean = true;
    do_update_loop: boolean = true;
    do_main_loop: boolean = false; // leave false

    follow_pointed_orbit: "none" | "imediate" | "auto" = "auto";

    WorldPlanetarySystemID: number;
    globalIsReady: boolean = false; // global flag for when Tickers can run
    timeUpdSpeed = 0.001;

    genEnsureInHabZone = true;
    genEnsureCenteredInHabZone = true;
    genEnsureMoonInHabZone = true;

    keepDbAtPageRefresh = false; // EXPERIMENTAL

    terrain_geo_view: string = DrawD3Terrain.defaultGeoViews();

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

export enum WorkerState {
    Paused,
    Ready,
    Running,
}

export declare type WorkerData = {
    state: WorkerState
}