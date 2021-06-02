import { BaseDrawUpdateWorker, DrawWorkerInstance } from "../modules/GenWorkerMetadata";
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { Config, MessageType, WorkerEvent, WorkerPacket, WorldGenType } from "../modules/Config";
import { JguiMake } from "../gui/JguiMake";
import { jguiData, setMainContainer } from "../gui/JguiUtils";
import { Terrain } from "../planet/Terrain";
import { Planet } from "../orbiting_elements/Planet";



const JGUI_ORDINAL = "3"
const WORLD_GEN_ORDER = 301;


export class SettlementWorker extends BaseDrawUpdateWorker {

    public settlement: Terrain;

    constructor(config: Config, worker: Worker, workerName: string, event: WorkerEvent) {
        super(config, worker, workerName, event);

    }


    public init(): void {
        Promise.resolve().then(() => {
            this.makeJgiu();
        }).then(() => {
            this.worker.postMessage(<WorkerPacket>{
                message: MessageType.CanvasMake,
                metaCanvas: {
                    id: `${this.name}-canvas-DrawThreeTerrain`,
                    order: JGUI_ORDINAL + "10",
                    generalFlags: ["orbit"],
                }
            });
            // }).then(() => {
            //     return this.refreshDeep(false);
        })
    }


    public CanvasReady(event: WorkerEvent): void {
        console.log(`CanvasReady ${this.name}`);
        // switch (event.data.metaCanvas.id) {
        //     case `${this.name}-canvas-DrawThreeTerrain`:
        //         var draw1_ = new DrawThreeTerrain();
        //         this.mapDraws.set(event.data.canvas_id, draw1_);
        //         this.spread_objects(draw1_)
        //         this.updateJgiu(draw1_)
        //         draw1_.init(event);
        //         break;
        //     case `${this.name}-canvas-DrawD3Terrain`:
        //         var draw2_ = new DrawD3Terrain();
        //         this.mapDraws.set(event.data.canvas_id, draw2_);
        //         this.spread_objects(draw2_)
        //         this.updateJgiu(draw2_)
        //         draw2_.init(event);
        //         break;
        //     default:
        //         console.warn(`Not implemented in ${this.name} : ${event.data.metaCanvas.id} !`); break
        // }
    }


    public spread_objects(object_: any) {
        super.spread_objects(object_);
        if (object_.terrain === null) object_.terrain = this.settlement;
    }


    public async getWorldEvent(event: WorkerEvent) {
        console.debug(`#HERELINE TerrainWorker getWorldEvent `, event.data);
        if (WORLD_GEN_ORDER > event.data.event.worldGenIndex) {
            this.settlement.data.noiseSeed = Math.random();
            await this.genFromExistingPlanet();
            this.broadcastEvent({
                worldGenIndex: WORLD_GEN_ORDER,
                worldGenType: WorldGenType.Inital,
            });
        } else {
            console.debug(`World event is upstream, no acetion needed for ${this.name} !`)
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
        // console.log("this.world.time.value", this.world.time.value);
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
        console.debug(`#HERELINE TerrainWorker genFromExistingPlanet `);
        var didOnce = false;
        for await (const planet_ of this.world.iterObjsType(Planet, "readwrite")) {
            if (didOnce) break;
            if (planet_ instanceof Planet && planet_.isInHabZone) {
                // if (planet_.planetType == "Normal" && planet_.terrainId == null) {
                if (planet_.planetType == "Normal" && didOnce == false) {
                    // console.log("planet_", planet_);
                    // console.log("this.terrain", this.terrain);
                    this.settlement.initFromPlanet(planet_);
                    planet_.setTerrain(this.settlement);
                    this.world.setRwObj(this.settlement.data);
                    didOnce = true;
                }
            }
        }

        if (didOnce) {
            await this.refreshDeep(false);

            this.broadcastEvent({
                worldGenIndex: WORLD_GEN_ORDER,
                worldGenType: WorldGenType.Inital,
            });

            this.makeJgiu();
            for (const draw_ of this.mapDraws.values())
                this.updateJgiu(draw_)
        }
    }


    private makeJgiu() {
        const jguiOrdinal = JGUI_ORDINAL + "00";
        var startExpanded = true;

        [this.workerJguiMain, this.workerJguiCont] = new JguiMake(null).mkWorkerJgui("terr", jguiOrdinal, startExpanded);

        var jData: jguiData = {
            jGui: this.workerJguiCont,
            jMng: this.workerJguiManager,
        };


        var chboxUpd: JguiMake, chboxDraw: JguiMake;
        [chboxUpd, chboxDraw] = jData.jGui.add2CheckButtons("Update", this.doUpdate, "Draw", this.doDraw)
        chboxUpd.addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.doUpdate = event.data.event.target.checked;
        })
        chboxDraw.addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.doDraw = event.data.event.target.checked;
        })


        var genTab = jData.jGui.addColapse("Genearte", true)

        genTab.addButton("Re-Genearte")
            .addTooltip("Regenerating will use an actual Planet, first run uses a dummy instance so we do not wait for PlSys to gen.")
            .addEventListener(jData.jMng, "click", (event: WorkerEvent) => {
                this.settlement.data.noiseSeed = Math.random(); this.genFromExistingPlanet();
            })

        genTab.addNumber("altMinProc ", this.settlement.data.altitudeMinProc, 0.02).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.settlement.data.altitudeMinProc = event.data.event.target.valueAsNumber; this.genFromExistingPlanet();
        })
        genTab.addNumber("altMaxProc ", this.settlement.data.altitudeMaxProc, 0.02).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.settlement.data.altitudeMaxProc = event.data.event.target.valueAsNumber; this.genFromExistingPlanet();
        })

        setMainContainer(this.worker, this.workerJguiMain)
    }


}