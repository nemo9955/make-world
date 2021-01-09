const ctx: Worker = self as any;

// TODO make a performance monitor using SharedArrayBuffer, data just dumped in a structure and read in main (FPS, memory, etc)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer

import { DrawWorker } from "./DrawWorker";
import { UpdateWorker } from "./UpdateWorker";

var work_instance = null

ctx.addEventListener("message", (event) => {
    if (work_instance === null) {
        switch (event.data.create) {
            case "DrawWorker":
                work_instance = new DrawWorker(ctx); break;
            case "UpdateWorker":
                work_instance = new UpdateWorker(ctx); break;
            default:
                throw new Error("Type of worker not defined or none provided: " + event.data.create);
        }
    } else {
        work_instance.get_message(event)
    }
});

export default null as any;