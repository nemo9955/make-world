import { BaseDrawUpdateWorker } from "./GenWorkerMetadata";
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { Config, MessageType, WorkerEvent, WorkerPacket } from "./Config";
import { DrawD3Terrain } from "./DrawD3Terrain";
import { JguiMake } from "../gui/JguiMake";

export class TerrainWorker extends BaseDrawUpdateWorker {


    constructor(config: Config, worker: Worker, workerName: string, event: WorkerEvent) {
        super(config, worker, workerName, event);
    }


    public init(): void {
        Promise.resolve().then(() => {
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-DrawD3Terrain`,
                    order: "500",
                    generalFlags: ["d3"],
                }
            });
        }).then(() => {
            this.makeJgiu();
        })
    }


    public CanvasReady(event: WorkerEvent): void {
        console.log(`CanvasReady ${this.name}`);
        switch (event.data.metaCanvas.id) {
            case `${this.name}-canvas-DrawD3Terrain`:
                var draw2_ = new DrawD3Terrain();
                this.mapDraws.set(event.data.canvas_id, draw2_);
                this.spread_objects(draw2_)
                draw2_.init(event);
                break;
            default:
                console.warn(`Not implemented in ${this.name} : ${event.data.metaCanvas.id} !`); break
        }
    }


    public getMessageExtra(event: WorkerEvent) {
        // console.debug(`#HERELINE ${this.name} getMessageExtra  ${event.data.message}`);

        const message_ = (event.data.message as MessageType);
        switch (message_) {
            case MessageType.CanvasReady:
                this.CanvasReady(event); break;
            case MessageType.Event:
                this.callEvent(event); break;
            case MessageType.RefreshDBDeep:
            case MessageType.RefreshDBShallow:
            case MessageType.RefreshConfig:
                this.refreshDb(event, message_); break;
            default:
                console.warn(`Not implemented in ${this.name} : ${message_} !`); break
        }
    }

    public async refreshDb(event: WorkerEvent, refreshType: MessageType) {
        console.debug(`#HERELINE ${this.name} refreshDb ${refreshType}`);
        console.time(`#time ${this.name} refreshDb ${refreshType} `);

        await this.refreshConfig();
        var doSpecial = false;

        var prom: Promise<void> = null
        if (refreshType == MessageType.RefreshDBDeep)
            prom = this.refreshDeep(doSpecial)
        if (refreshType == MessageType.RefreshDBShallow)
            prom = this.refreshShallow(doSpecial)

        await prom.finally(() => {
            console.timeEnd(`#time ${this.name} refreshDb ${refreshType} `);
        })
    }



    private async refreshDeep(doSpecial = true) {
        console.debug("#HERELINE DrawWorker refreshDeep");
        // await this.world.readDeep();
        // this.planetarySystem = this.world.planetarySystem;
        for (const draw_ of this.mapDraws.values()) draw_.updateDeep();
        if (doSpecial) {
            // this.updatePlSys();
            for (const draw_ of this.mapDraws.values()) draw_.draw();
        }
    }

    private async refreshShallow(doSpecial = true) {
        // console.debug("#HERELINE DrawWorker refreshShallow");
        // await this.world.readShallow();
        for (const draw_ of this.mapDraws.values()) draw_.updateShallow();
        if (doSpecial) {
            // this.updatePlSys();
            for (const draw_ of this.mapDraws.values()) draw_.draw();
        }
    }



    public updateInterval(): void {
        // console.log(`It is me, ${this.name}`);
        // this.updPause();

        // for (const draw_ of this.mapDraws.values())
        //     draw_.draw();
        this.refreshTick(true)
    }



    private async refreshTick(doSpecial = true) {
        // console.debug("#HERELINE DrawWorker refreshShallow");
        // await this.world.readShallow();
        if (doSpecial) {
            // this.updatePlSys();
            for (const draw_ of this.mapDraws.values()) draw_.draw();
            // await this.world.writeShallow();
            // this.tellMainToUpdate();
        }
    }


    private makeJgiu() {
        var workerJgui: JguiMake;

        [this.workerJguiMain, workerJgui] = new JguiMake(null).mkWorkerJgui("terr", "600");

        workerJgui.addButton("Test 1").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            console.log("??????????????????? event", event.data.event);
        })
        workerJgui.addButton("Test 2").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!! event", event.data.event);
        })


        // var subStuff = workerJgui.addColapse("More stuff", true)
        // subStuff.addButton("Stuff 1")
        // subStuff.addButton("Stuff 2")
        // subStuff.addButton("Stuff 3")
        // var mrrStuff = subStuff.addColapse("MORRRR stuff", true)
        // mrrStuff.addButton("Thing 1")
        // mrrStuff.addButton("Thing 2")
        // mrrStuff.addButton("Thing 3")
        // subStuff.addSlider("SLIDE", 0, 100, 0.1)

        // console.log("this.workerJguiMain", this.workerJguiMain);

        this.worker.postMessage(<WorkerPacket>{
            message: MessageType.RefreshJGUI,
            jgui: this.workerJguiMain,
            metadata: {
                isMainWorkerContainer: true,
            }
        });
    }


}