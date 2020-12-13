
/*
* Used to store and send VERRY simple data across the main thread and workers
*/

export class Config {
    update_draw: boolean = true
    world_id: number
    innerWidth: number
    innerHeight: number

    public clone(config_: Config) {
        if (config_.update_draw !== undefined)
            this.update_draw = config_.update_draw
        if (config_.world_id !== undefined)
            this.world_id = config_.world_id
        if (config_.innerWidth !== undefined)
            this.innerWidth = config_.innerWidth
        if (config_.innerHeight !== undefined)
            this.innerHeight = config_.innerHeight
    }
}
