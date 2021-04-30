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
import { jguiData, setMainContainer } from "../gui/JguiUtils";
import { SpaceFactory } from "../generate/SpaceFactory";


// TODO move generation in this worker instead of in the main thread
// TODO simplify the refresh deep/shallow mechanisms since most actions will be done in this worker
// TODO store position and rotation of objects inside themselves after time/orbit update so other workers can do "basic" checks and calculations


const MAIN_ORDINAL = "5"

export class PlanetSysWorker extends BaseDrawUpdateWorker {


    public planetarySystem: PlanetarySystem = null;
    public readonly spaceFactory: SpaceFactory = null;



    constructor(config: Config, worker: Worker, workerName: string, event: WorkerEvent) {
        super(config, worker, workerName, event);
        // this.ticker.tick_interval = Units.LOOP_INTERVAL / 10;
        this.planetarySystem = new PlanetarySystem(this.world);
        this.spaceFactory = new SpaceFactory(this.world);
        this.spread_objects(this.planetarySystem)
        this.spread_objects(this.spaceFactory)
    }

    public init(): void {
        Promise.resolve().then(() => {
            this.makeJgiu();
        }).then(() => {
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-DrawThreePlsys`,
                    order: MAIN_ORDINAL + "10",
                    generalFlags: ["orbit"],
                }
            });
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-DrawD3Plsys`,
                    order: MAIN_ORDINAL + "20",
                    generalFlags: [],
                }
            });
        }).then(() => {

            this.planetarySystem.init();
            /////////// this.planetary_system.setWorldData(this);
            /////////// this.setOrbElem(this.planetary_system);
            this.spaceFactory.genStartingPlanetSystem(this.planetarySystem);

        }).then(() => {
            console.log("this.world", this.world);
            //     return this.world.writeDeep();
        }).then(() => {
            return this.refreshDeep(false);
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
                this.updateJgiu(draw1_)
                draw1_.updateDeep();
                break;
            case `${this.name}-canvas-DrawD3Plsys`:
                var draw2_ = new DrawD3Plsys();
                this.mapDraws.set(event.data.canvas_id, draw2_);
                this.spread_objects(draw2_)
                draw2_.init(event);
                this.updateJgiu(draw2_)
                break;
            default:
                console.warn(`Not implemented in ${this.name} : ${event.data.metaCanvas.id} !`); break
        }
    }

    public spread_objects(object_: any) {
        super.spread_objects(object_);
        if (object_.spaceFactory === null) object_.spaceFactory = this.spaceFactory;
        if (object_.planetarySystem === null) object_.planetarySystem = this.planetarySystem;
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
        await this.world.writeAllRw();
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
        await this.world.readTime();
        if (doSpecial) {

            this.doUpdate && this.updatePlSys();

            if (this.doDraw)
                for (const draw_ of this.mapDraws.values())
                    draw_.draw();
            // await this.world.writeShallow();
            // this.tellMainToUpdate();
        }
        await this.world.writeTime();
    }



    public updatePlSys() {
        // console.debug("#HERELINE UpdateWorld update ", this.world.planetary_system.time.ey);
        // TODO make a separate object for this data,seeds and similar value will need to be stored in the future
        this.world.time.ey += this.config.timeEarthYearsTick;
        // console.log("this.world.planetary_system.time.ey", this.world.planetary_system.time.ey);

        // this.updateTerrain();
    }



    private makeJgiu() {
        var plsys = this.planetarySystem;
        var workerJguiManager = this.workerJguiManager;
        var workerJgui: JguiMake;
        var startExpanded = false;
        const jguiOrdinal = MAIN_ORDINAL + "00";

        [this.workerJguiMain, workerJgui] = new JguiMake(null).mkWorkerJgui("plsys", jguiOrdinal, startExpanded);


        var chboxUpd: JguiMake, chboxDraw: JguiMake;
        [chboxUpd, chboxDraw] = workerJgui.add2CheckButtons("Update", this.doUpdate, "Draw", this.doDraw)
        chboxUpd.addEventListener(this.workerJguiManager, "change", (event: WorkerEvent) => {
            this.doUpdate = event.data.event.target.checked;
        })
        chboxDraw.addEventListener(this.workerJguiManager, "change", (event: WorkerEvent) => {
            this.doDraw = event.data.event.target.checked;
        })


        workerJgui.addButton("genStartingPlanetSystem").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.spaceFactory.genStartingPlanetSystem(plsys)
            this.refreshDeep()
        })

        workerJgui.addButton("genStar").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.spaceFactory.genStar(plsys, plsys)
            this.refreshDeep()
        })

        workerJgui.addButton("genPTypeStarts").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.spaceFactory.genPTypeStarts(plsys, plsys)
            this.refreshDeep()
        })

        workerJgui.addButton("genOrbitsSimple").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.spaceFactory.genOrbitsSimple(plsys, plsys.root())
            this.refreshDeep()
        })

        workerJgui.addButton("genOrbitsSimpleMoons").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
            this.spaceFactory.genOrbitsSimpleMoons(plsys, plsys.root())
            this.refreshDeep()
        })

        // workerJgui.addButton("genOrbitsUniform").addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
        //     this.spaceFactory.genOrbitsUniform(plsys, plsys.root())
        //     this.refreshDeep()
        // })



        workerJgui.addSlider("Earth years upd", 0, 0.005, 0.00001, this.config.timeEarthYearsTick)
            .addEventListener(workerJguiManager, "input", (event: WorkerEvent) => {
                this.config.timeEarthYearsTick = Number.parseFloat(event.data.event.target.value);
            })


        setMainContainer(this.worker, this.workerJguiMain)
    }



}