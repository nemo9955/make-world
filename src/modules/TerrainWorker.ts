import { BaseWorker } from "./GenWorkerMetadata";
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { Config, MessageType, WorkerEvent, WorkerPacket } from "./Config";

export class TerrainWorker extends BaseWorker {


    constructor(config: Config, worker: Worker, workerName: string, event: WorkerEvent) {
        super(config, worker, workerName, event);
    }


    public init(): void {
        this.world.initWorker().then(() => {
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-1`,
                    order: "600",
                    generalFlags: ["d3"],
                }
            });
        })
    }


    public getMessageExtra(event: WorkerEvent) {
        console.debug(`#HERELINE ${this.name} getMessageExtra  ${event.data.message}`);

        const message_ = (event.data.message as MessageType);
        switch (message_) {
            case MessageType.CanvasReady:
                this.CanvasReady(event); break;
            default:
                console.warn(`Not implemented in ${this.name} : ${message_} !`); break
        }
    }

    public CanvasReady(event: WorkerEvent): void {
        console.log(`CanvasReady ${this.name}`);
    }


    public updateInterval(): void {
        console.log(`It is me, ${this.name}`);
        this.updPause(); // TODO TMP
    }

}