import { BaseDrawUpdateWorker } from "./GenWorkerMetadata";

import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { Config, MessageType, WorkerEvent, WorkerPacket } from "./Config";
import { DrawThreePlsys } from "./DrawThreePlsys";
import { PlanetarySystem } from "../generate/PlanetarySystem";
import { WorldData } from "./WorldData";
import { WorkerDOM } from "../utils/WorkerDOM";
import { DrawD3Plsys } from "./DrawD3Plsys";
import { JguiMake } from "../gui/JguiMake";
import { setMainContainer } from "../gui/JguiUtils";


// TODO move generation in this worker instead of in the main thread
// TODO simplify the refresh deep/shallow mechanisms since most actions will be done in this worker
// TODO store position and rotation of objects inside themselves after time/orbit update so other workers can do "basic" checks and calculations


export class PlanetSysWorker extends BaseDrawUpdateWorker {



    constructor(config: Config, worker: Worker, workerName: string, event: WorkerEvent) {
        super(config, worker, workerName, event);
        // this.ticker.tick_interval = Units.LOOP_INTERVAL / 10;
    }

    public init(): void {
        Promise.resolve().then(() => {
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-DrawThreePlsys`,
                    order: "400",
                    generalFlags: ["orbit"],
                }
            });
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-DrawD3Plsys`,
                    order: "800",
                    generalFlags: [],
                }
            });
        }).then(() => {
            return this.world.initPlSys();
        }).then(() => {
            console.log("this.world", this.world);
            //     return this.world.writeDeep();
        }).then(() => {
            // return this.refreshDeep(true);
        }).then(() => {
            this.makeJgiu();
        })
    }


    public CanvasReady(event: WorkerEvent): void {
        console.log(`CanvasReady ${this.name}`);
        switch (event.data.metaCanvas.id) {
            case `${this.name}-canvas-DrawThreePlsys`:
                var draw1_ = new DrawThreePlsys();
                this.mapDraws.set(event.data.canvas_id, draw1_);
                this.spread_objects(draw1_)
                draw1_.init(event);
                draw1_.updateDeep();
                break;
            case `${this.name}-canvas-DrawD3Plsys`:
                var draw2_ = new DrawD3Plsys();
                this.mapDraws.set(event.data.canvas_id, draw2_);
                this.spread_objects(draw2_)
                draw2_.init(event);
                break;
            default:
                console.warn(`Not implemented in ${this.name} : ${event.data.metaCanvas.id} !`); break
        }
    }


    public getMessageExtra(event: WorkerEvent) {
        // console.debug(`#HERELINE ${this.name} getMessageExtra  ${event.data.message}`, event.data);

        const message_ = (event.data.message as MessageType);
        switch (message_) {
            case MessageType.CanvasReady:
                this.CanvasReady(event); break;
            case MessageType.Event:
                this.callEvent(event); break;
            case MessageType.RefreshDBDeep:
            case MessageType.RefreshDBShallow:
                this.refreshDb(event, message_); break;
            case MessageType.RefreshConfig:
                this.refreshConfig(); break;
            default:
                console.warn(`Not implemented in ${this.name} : ${message_} !`); break
        }
    }



    public updateInterval(): void {
        // this.updPause();
        this.refreshTick(true)
    }



    private tellMainToUpdate() {
        // console.debug("#HERELINE UpdateWorker tellMainToUpdate");
        // TODO tell more exactly what and how to update !!!!
        this.worker.postMessage(<WorkerPacket>{ message: MessageType.RefreshDBShallow });
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
        // console.debug("#HERELINE DrawWorker refreshDeep");
        // await this.world.readDeep();
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

    private async refreshTick(doSpecial = true) {
        // console.debug("#HERELINE DrawWorker refreshShallow");
        // await this.world.readShallow();
        if (doSpecial) {

            this.doUpdate && this.updatePlSys();

            if (this.doDraw)
                for (const draw_ of this.mapDraws.values())
                    draw_.draw();
            // await this.world.writeShallow();
            // this.tellMainToUpdate();
        }
    }



    public updatePlSys() {
        // console.debug("#HERELINE UpdateWorld update ", this.world.planetary_system.time.ey);
        // TODO make a separate object for this data,seeds and similar value will need to be stored in the future
        this.world.planetarySystem.time.ey += this.config.timeUpdSpeed;
        // console.log("this.world.planetary_system.time.ey", this.world.planetary_system.time.ey);

        // this.updateTerrain();
    }



    private makeJgiu() {
        var plsys = this.world.planetarySystem
        var workerJgui: JguiMake;

        [this.workerJguiMain, workerJgui] = new JguiMake(null).mkWorkerJgui("plsys", "200", false);


        var chboxUpd: JguiMake, chboxDraw: JguiMake;
        [chboxUpd, chboxDraw] = workerJgui.add2CheckButtons("Update", this.doUpdate, "Draw", this.doDraw)
        chboxUpd.addEventListener(this.workerJguiManager, "change", (event: WorkerEvent) => {
            this.doUpdate = event.data.event.target.checked;
        })
        chboxDraw.addEventListener(this.workerJguiManager, "change", (event: WorkerEvent) => {
            this.doDraw = event.data.event.target.checked;
        })


        workerJgui.addButton("genStartingPlanetSystem").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.world.spaceFactory.genStartingPlanetSystem(plsys)
            this.refreshDeep()
        })

        workerJgui.addButton("genStar").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.world.spaceFactory.genStar(plsys, plsys)
            this.refreshDeep()
        })

        workerJgui.addButton("genPTypeStarts").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.world.spaceFactory.genPTypeStarts(plsys, plsys)
            this.refreshDeep()
        })

        workerJgui.addButton("genOrbitsSimple").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.world.spaceFactory.genOrbitsSimple(plsys, plsys.root())
            this.refreshDeep()
        })

        workerJgui.addButton("genOrbitsSimpleMoons").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.world.spaceFactory.genOrbitsSimpleMoons(plsys, plsys.root())
            this.refreshDeep()
        })

        // workerJgui.addButton("genOrbitsUniform").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
        //     this.world.spaceFactory.genOrbitsUniform(plsys, plsys.root())
        //     this.refreshDeep()
        // })



        // console.log("this.workerJguiMain", this.workerJguiMain);

        setMainContainer(this.worker, this.workerJguiMain)

    }



}