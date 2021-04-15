
export function waitBlocking(ms: number) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}


export class Intervaler {

    last_time: number;

    constructor() {
        this.last_time = +new Date();
    }

    public check(interval: number) {
        const now_ = +new Date();
        if (now_ - this.last_time > interval) {
            this.last_time = now_;
            return true;
        }
        return false;
    }

}

export class Ticker {

    public enabled: boolean;
    public timeout_val: NodeJS.Timeout;

    public tick_function: any
    public tick_interval: number;
    public delay_interval: number;
    public used_delay: number;

    constructor(enabled = false, tick_function = null, tick_interval = 100, delay_interval = 0) {
        this.enabled = enabled
        this.timeout_val = null
        this.tick_function = tick_function
        this.delay_interval = delay_interval
        this.used_delay = this.delay_interval
        this.tick_interval = tick_interval
    }

    public tick() {
        this.tick_function()
    }

    // TODO FIXME check if there is a recursivity issue
    public start() {
        this.enabled = true;
        if (this.timeout_val === null) {
            this.timeout_val = setTimeout(() => {
                this.timeout_val = null;
                this.used_delay = 0;
                this.start();
                this.tick();
            }, this.tick_interval + this.used_delay);
        }
    }

    public stop() {
        this.enabled = false;
        if (this.timeout_val !== null) {
            clearTimeout(this.timeout_val)
            this.timeout_val = null;
        }
    }

    public updateState(setEnable: boolean) {
        // console.warn(`#HERELINE Time updateState setEnable ${setEnable} `);
        if (setEnable == this.enabled) return;
        if (setEnable) this.start();
        else this.stop();
    }


}