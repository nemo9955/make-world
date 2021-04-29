import { BaseDrawUpdateWorker, DrawWorkerInstance } from "./GenWorkerMetadata";
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { Config, MessageType, WorkerEvent, WorkerPacket } from "./Config";
import { DrawD3Terrain } from "./DrawD3Terrain";
import { JguiMake } from "../gui/JguiMake";
import { setMainContainer } from "../gui/JguiUtils";
import { Terrain } from "../generate/Terrain";
import { DrawThreeTerrain } from "./DrawThreeTerrain";
import { Planet } from "../generate/Planet";



const MAIN_ORDINAL = "2"

export class TerrainWorker extends BaseDrawUpdateWorker {


    public terrain: Terrain;

    constructor(config: Config, worker: Worker, workerName: string, event: WorkerEvent) {
        super(config, worker, workerName, event);
        this.terrain = new Terrain(this.world);
    }


    public init(): void {
        Promise.resolve().then(() => {
            this.makeJgiu();
        }).then(() => {
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-DrawThreeTerrain`,
                    order: MAIN_ORDINAL + "10",
                    generalFlags: ["orbit"],
                }
            });
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-DrawD3Terrain`,
                    order: MAIN_ORDINAL + "20",
                    generalFlags: ["d3"],
                }
            });
        }).then(() => {
            /// TODO FIXME TMP until we have a proper "sequence" of generartion steps
            var DUMMY_PLANET = new Planet(this.world);
            DUMMY_PLANET.makeEarthLike();
            this.world.setRwObj(DUMMY_PLANET);

            this.terrain.init(DUMMY_PLANET);
            this.world.setRwObj(this.terrain);
        }).then(() => {
            return this.refreshDeep(false);
        })
    }


    public CanvasReady(event: WorkerEvent): void {
        console.log(`CanvasReady ${this.name}`);
        switch (event.data.metaCanvas.id) {
            case `${this.name}-canvas-DrawThreeTerrain`:
                var draw1_ = new DrawThreeTerrain();
                this.mapDraws.set(event.data.canvas_id, draw1_);
                this.spread_objects(draw1_)
                this.updateJgiu(draw1_)
                draw1_.init(event);
                break;
            case `${this.name}-canvas-DrawD3Terrain`:
                var draw2_ = new DrawD3Terrain();
                this.mapDraws.set(event.data.canvas_id, draw2_);
                this.spread_objects(draw2_)
                this.updateJgiu(draw2_)
                draw2_.init(event);
                break;
            default:
                console.warn(`Not implemented in ${this.name} : ${event.data.metaCanvas.id} !`); break
        }
    }


    public spread_objects(object_: any) {
        super.spread_objects(object_);
        if (object_.terrain === null) object_.terrain = this.terrain;
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



    public updateInterval(): void {
        // console.log(`It is me, ${this.name}`);
        // this.updPause();

        // for (const draw_ of this.mapDraws.values())
        //     draw_.draw();
        this.refreshTick(true)
    }


    public updateTerrain() {
    }


    private async refreshTick(doSpecial = true) {
        await this.world.readTime();
        if (doSpecial) {
            this.doUpdate && this.updateTerrain();
            if (this.doDraw)
                for (const draw_ of this.mapDraws.values())
                    draw_.draw();
        }
        // await this.world.writeTime();
    }


    private async genFromExistingPlanet() {
        var didOnce = false;
        for await (const planet_ of this.world.iterObjsType(Planet, "readwrite")) {
            if (didOnce) break;
            if (planet_ instanceof Planet && planet_.isInHabZone) {
                // if (planet_.planetType == "Normal" && planet_.terrainId == null) {
                if (planet_.planetType == "Normal" && didOnce == false) {
                    console.log("planet_", planet_);
                    console.log("this.terrain", this.terrain);
                    this.terrain.init(planet_);
                    planet_.setTerrain(this.terrain);
                    this.refreshDeep(false);
                    didOnce = true;
                }
            }
        }
    }


    private makeJgiu() {

        const jguiOrdinal = MAIN_ORDINAL + "00";


        [this.workerJguiMain, this.workerJguiCont] = new JguiMake(null).mkWorkerJgui("terr", jguiOrdinal);

        var chboxUpd: JguiMake, chboxDraw: JguiMake;
        [chboxUpd, chboxDraw] = this.workerJguiCont.add2CheckButtons("Update", this.doUpdate, "Draw", this.doDraw)
        chboxUpd.addEventListener(this.workerJguiManager, "change", (event: WorkerEvent) => {
            this.doUpdate = event.data.event.target.checked;
        })
        chboxDraw.addEventListener(this.workerJguiManager, "change", (event: WorkerEvent) => {
            this.doDraw = event.data.event.target.checked;
        })

        this.workerJguiCont.addButton("Re-Genearte")
            .addTooltip("Regenerating will use an actual Planet, first run uses a dummy instance so we do not wait for PlSys to gen.")
            .addEventListener(this.workerJguiManager, "click", (event: WorkerEvent) => {
                this.genFromExistingPlanet();
            })



        setMainContainer(this.worker, this.workerJguiMain)
    }


}