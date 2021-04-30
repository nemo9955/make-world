import { Intervaler, Ticker } from "../utils/Time";
import { Config, MessageType, WorkerEvent, WorkerPacket } from "./Config";
import { WorldData } from "./WorldData";


import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { TerrainWorker } from "./TerrainWorker";
import { PlanetSysWorker } from "./PlanetSysWorker";
import { WorkerDOM } from "../utils/WorkerDOM";
import { JguiMake, JguiManager } from "../gui/JguiMake";
import { jguiData, setMainContainer } from "../gui/JguiUtils";


export abstract class BaseWorker {

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
        this.world = new WorldData(this.config.WORLD_DATABASE_NAME, this.name, event.data.startId, this.config);
        this.ticker = new Ticker(false, this.updateInterval.bind(this), Units.LOOP_INTERVAL)
    }

    public preInit() {
        this.spread_objects(this.world)
        this.world.initWorker().then(() => {
            this.worker.postMessage(<WorkerPacket>{ message: MessageType.Ready, from: this.name });
        }).then(() => {
            this.init();
        })
    }

    public spread_objects(object_: any) {
        if (object_.config === null) object_.config = this.config
        if (object_.world === null) object_.world = this.world
        if (object_.worker === null) object_.worker = this.worker
    }

    public abstract updateInterval(): void;
    public abstract init(): void;

    public getMessage(event: WorkerEvent) {
        console.debug(`#HERELINE ${this.name} getMessage  ${event.data.message}`);

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
        // this.ticker.updateState(this.config.globalIsReady)
    }


    protected updPause() {
        this.ticker.stop();
    }

    protected updPlay() {
        this.ticker.start();
    }
}


export interface DrawWorkerInstance {
    readonly type: string;
    world: WorldData;
    canvasOffscreen: OffscreenCanvas;
    config: Config;
    fakeDOM: WorkerDOM;

    init(event: WorkerEvent): void;
    updateShallow(): void;
    updateDeep(): void;
    draw(): void;
    addJgui(jData: jguiData): void;
}


export abstract class BaseDrawUpdateWorker extends BaseWorker {

    public doUpdate = true;
    public doDraw = true;

    public mapDraws = new Map<any, DrawWorkerInstance>();
    public workerJguiMain: JguiMake = null;
    public workerJguiCont: JguiMake = null;
    public workerJguiManager: JguiManager = null;

    constructor(config: Config, worker: Worker, workerName: string, event: WorkerEvent) {
        super(config, worker, workerName, event);
        this.workerJguiManager = new JguiManager(worker, workerName);
    }

    callEvent(woEvent: WorkerEvent) {
        var event = woEvent.data.event;
        var event_id = woEvent.data.event_id;

        if (woEvent.data?.metadata?.isFromJgui) {
            this.workerJguiManager.dispachListener(event_id, woEvent)
        } else {
            var drawRedirect = this.mapDraws.get(event_id);
            drawRedirect.fakeDOM.dispatchEvent(event);
        }
    }


    protected updateJgiu(draw_: DrawWorkerInstance) {
        var jData: jguiData = {
            jGui: this.workerJguiCont,
            jMng: this.workerJguiManager,
        }

        draw_.addJgui(jData);
        setMainContainer(this.worker, this.workerJguiMain)
    }

    public spread_objects(object_: any) {
        super.spread_objects(object_);
        if (object_.workerJguiManager === null) object_.workerJguiManager = this.workerJguiManager;
    }



}
