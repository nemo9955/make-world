import { Intervaler, Ticker } from "../utils/Time";
import { Config, MessageType, WorkerEvent } from "./Config";
import { SharedData } from "./SharedData";
import { WorldData } from "./WorldData";


import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { TerrainWorker } from "./TerrainWorker";
import { PlanetSysWorker } from "./PlanetSysWorker";



export abstract class BaseWorker {
    sharedData = new SharedData();

    world: WorldData;
    config: Config;
    worker: Worker;
    name: string;

    db_read_itv = new Intervaler();
    ticker: Ticker;

    constructor(config: Config, worker: Worker, workerName: string, event: WorkerEvent) {
        this.name = workerName;
        this.worker = worker;
        this.config = new Config().copy(config);
        this.world = new WorldData(this.config.WORLD_DATABASE_NAME, this.name);
        this.ticker = new Ticker(false, this.updateInterval.bind(this), Units.LOOP_INTERVAL)
        this.sharedData.initShared(event.data.sab)
    }

    public preInit() {
        this.spread_objects(this.world)
        this.world.initWorker().then(() => {
            this.worker.postMessage({ message: MessageType.Ready, from: this.name });
        })
        this.init();
    }

    public spread_objects(object_: any) {
        if (object_.sharedData === null) object_.sharedData = this.sharedData
        if (object_.config === null) object_.config = this.config
        if (object_.world === null) object_.world = this.world
    }

    public abstract updateInterval(): void;
    public abstract init(): void;

    public getMessage(event: WorkerEvent) {
        // console.debug(`#HERELINE ${this.name} getMessage  ${event.data.message}`);

        if (event?.data?.config && this.config)
            this.config.copy(event.data.config as Config)

        const message_ = (event.data.message as MessageType);
        switch (message_) {
            case MessageType.InitWorker:
                this.preInit(); break;
            case MessageType.Play:
                this.updPlay(); break;
            case MessageType.Pause:
                this.updPause(); break;
            default:
                this.getMessageExtra(event);
        }
    }

    protected getMessageExtra(event: WorkerEvent) {
        const message_ = (event.data.message as MessageType);
        console.warn(`Not implemented in ${this.name} : ${message_} !`);
    }


    public async refreshConfig() {
        this.ticker.updateState(this.config.globalIsReady)
    }


    protected updPause() {
        this.ticker.stop();
    }

    protected updPlay() {
        this.ticker.start();
    }
}