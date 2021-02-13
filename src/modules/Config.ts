
/*
* Used to store and send VERRY simple data across the main thread and workers
*/
import * as Convert from "../utils/Convert"

export class Config {
    do_draw_loop: boolean = true;
    do_update_loop: boolean = false;
    do_main_loop: boolean = false; // leave false

    follow_pointed_orbit: "none" | "imediate" | "auto" = "auto";

    WorldPlanetarySystemID: number;
    globalIsReady: boolean = false; // global flag for when Tickers can run
    timeUpdSpeed = 0.01;

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
