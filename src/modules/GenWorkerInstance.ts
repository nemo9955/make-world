const ctx: Worker = self as any;

import { WorkerEvent } from "../modules/Config";
// TODO make a performance monitor using SharedArrayBuffer, data just dumped in a structure and read in main (FPS, memory, etc)
// TODO add mouse position to buffer so basic highlights in workers can be done ...
// TODO send some raw inputs to workers like mouse click and keypress ... mouse move/scross sounds exccesive
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer

import { BaseWorker } from "../modules/GenWorkerMetadata";
import { PlanetSysWorker } from "../plant_sys/PlanetSysWorker";
import { TerrainWorker } from "../planet/TerrainWorker";



export var workerTypes: Map<string, typeof BaseWorker> = new Map();
workerTypes["TerrainWorker"] = TerrainWorker;
workerTypes["PlanetSysWorker"] = PlanetSysWorker;

var work_instance: any = null

ctx.addEventListener("message", (event: WorkerEvent) => {
    if (work_instance === null) {
        var config = event.data.config;
        work_instance = new workerTypes[event.data.create](config.WORLD_DATABASE_NAME, ctx, event.data.create, event);
    } else {
        work_instance.getMessage(event)
    }
});

// export default null as any;