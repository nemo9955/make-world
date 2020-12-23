
/*
* Used to store and send VERRY simple data across the main thread and workers
*/

export class Config {
    update_draw: boolean = true
    innerWidth: number
    innerHeight: number

    WorldDataID: number

    public copy(config_: Config) {
        if (config_.update_draw !== undefined)
            this.update_draw = config_.update_draw
        if (config_.WorldDataID !== undefined)
            this.WorldDataID = config_.WorldDataID
        if (config_.innerWidth !== undefined)
            this.innerWidth = config_.innerWidth
        if (config_.innerHeight !== undefined)
            this.innerHeight = config_.innerHeight
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
