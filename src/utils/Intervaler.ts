
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