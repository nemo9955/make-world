
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

    WorldPlanetarySystemID: number

    public copy(source_: Config) {
        Convert.copy(this, source_)
    }
}

export enum MessageType {
    Ready = "Ready",
    InitWorker = "InitWorker",
    InitCanvas = "InitCanvas",
    RefreshDB = "RefreshDB",
    RefreshConfig = "RefreshConfig",
    RefreshCamera = "RefreshCamera",
    MakeCanvas = "MakeCanvas",
    Resize = "Resize"
}
