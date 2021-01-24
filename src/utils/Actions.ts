type ActionCallback = (data?: any, name?: string, manager?: ActionsManager) => void;

export class ActionsManager {

    callbacks = new Map<string, Array<ActionCallback>>();

    // constructor() { }

    public addAction(actName: string, actCallback: ActionCallback) {
        if (this.callbacks[actName] === undefined)
            this.callbacks[actName] = new Array<ActionCallback>()

        if (this.hasAction(actName, actCallback) === false) {
            // console.log("actCallback", actCallback);
            this.callbacks[actName].push(actCallback);
            // console.debug("#HERELINE Actions addAction ", actName, this.callbacks[actName]);
        }

    }

    public hasAction(actName: string, actCallback: ActionCallback) {
        if (this.callbacks[actName] === undefined)
            return false;

        return this.callbacks[actName].includes(actCallback)
    }

    public removeAction(actName: string, actCallback: ActionCallback) {
        if (this.callbacks[actName] === undefined)
            return;

        const index: number = this.callbacks[actName].indexOf(actCallback);
        if (index > - 1)
            this.callbacks[actName].splice(index, 1);

    }

    public callAction(actName: string, data: any = null) {
        if (this.callbacks[actName] === undefined) return;

        const callbacks_copy = [...this.callbacks[actName]]
        for (let index = 0; index < callbacks_copy.length; index++) {
            const cb_ = callbacks_copy[index];
            cb_(data, actName, this)
            // if (data?.stopAfterMe === true) break;
        }
    }

    public callActionDelay(actName: string, data: any = null) {
        if (this.callbacks[actName] === undefined)
            return;

        const callbacks_copy = [...this.callbacks[actName]]
        for (let index = 0; index < callbacks_copy.length; index++) {
            const cb_ = callbacks_copy[index];
            setTimeout(() => {
                cb_(data, actName, this)
            }, 0)
        }
    }

    // public async callActionAsync(actName: string, data: any = null) {
    //     if (this.callbacks[actName] === undefined)
    //         return;

    //     const callbacks_copy = new Array<ActionCallback>(this.callbacks[actName])
    //     for (let index = 0; index < callbacks_copy.length; index++) {
    //         const cb_ = callbacks_copy[index][0];
    //         cb_(data, actName, this)
    //         // Promise.apply(cb_, [data, actName, this])
    //     }
    // }


}