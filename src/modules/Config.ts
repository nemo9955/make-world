
/*
* Used to store and send VERRY simple data across the main thread and workers
*/
import * as Convert from "../utils/Convert"

export class Config {
    do_draw_loop: boolean = true
    do_update_loop: boolean = true
    do_main_loop: boolean = true
    innerWidth: number
    innerHeight: number

    follow_pointed_orbit: boolean = false

    timeUpdSpeed = 3;

    WorldPlanetarySystemID: number

    public copy(source_: Config) {
        Convert.copyShallow(this, source_)
    }
}

export enum MessageType {
    Ready = "Ready",
    InitWorker = "InitWorker",
    InitCanvas = "InitCanvas",
    RefreshDBDeep = "RefreshDBDeep",
    RefreshDBShallow = "RefreshDBShallow",
    RefreshConfig = "RefreshConfig",
    RefreshCamera = "RefreshCamera",
    MakeCanvas = "MakeCanvas",
    Resize = "Resize"
}
