const ctx: Worker = self as any;

import { DrawWorker } from "./DrawWorker";

var work_instance = new DrawWorker()

ctx.addEventListener("message", async (event) => {
    work_instance.get_message(ctx, event)
});

export default null as any;