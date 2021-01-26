
export function wait(ms: number) {
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

    public tick_interval: number;
    public tick_function: any

    constructor(enabled = false, tick_function = null, tick_interval = 100) {
        this.enabled = enabled
        this.timeout_val = null
        this.tick_function = tick_function
        this.tick_interval = tick_interval
    }

    public tick() {
        this.tick_function()
    }

    public start() {
        if (this.timeout_val === null) {
            this.timeout_val = setTimeout(() => {
                this.timeout_val = null;
                this.start();
                this.tick();
            }, this.tick_interval);
        }
    }

    public stop() {
        if (this.timeout_val !== null) {
            clearTimeout(this.timeout_val)
            this.timeout_val = null;
        }
    }

    // TODO add posibility of random delay for first start
    // so update/draw
    public updateState(state: boolean) {
        if (state) this.start();
        else this.stop();
    }


}