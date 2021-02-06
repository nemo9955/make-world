
/*
* Used to store and send VERRY simple data across the main thread and workers
*/
import * as Convert from "../utils/Convert"

export class Config {
    do_draw_loop: boolean = true
    do_update_loop: boolean = false
    do_main_loop: boolean = false // leave false
    innerWidth: number
    innerHeight: number

    follow_pointed_orbit: boolean = false

    timeUpdSpeed = 4;

    WorldPlanetarySystemID: number

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
    Resize = "Resize"
}
