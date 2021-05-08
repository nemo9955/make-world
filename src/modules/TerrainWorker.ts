import { BaseDrawUpdateWorker, DrawWorkerInstance } from "./GenWorkerMetadata";
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { Config, MessageType, WorkerEvent, WorkerPacket } from "./Config";
import { DrawD3Terrain } from "./DrawD3Terrain";
import { JguiMake } from "../gui/JguiMake";
import { jguiData, setMainContainer } from "../gui/JguiUtils";
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
                    order: MAIN_ORDINAL + "30",
                    generalFlags: ["d3"],
                }
            });
        }).then(() => {
            /// TODO FIXME TMP until we have a proper "sequence" of generartion steps
            var DUMMY_PLANET = new Planet(this.world);
            DUMMY_PLANET.makeEarthLike();
            this.world.setRwObj(DUMMY_PLANET);
            this.terrain.initFromPlanet(DUMMY_PLANET);
            this.world.setRwObj(this.terrain.data);
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
                    console.log("planet_", planet_);
                    console.log("this.terrain", this.terrain);
                    this.terrain.initFromPlanet(planet_);
                    planet_.setTerrain(this.terrain);
                    this.refreshDeep(false);
                    didOnce = true;
                }
            }
        }
    }


    private makeJgiu() {
        const jguiOrdinal = MAIN_ORDINAL + "00";
        var startExpanded = !true;

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
                this.terrain.data.noiseSeed = Math.random(); this.genFromExistingPlanet();
            })

        genTab.addNumber("altMinProc ", this.terrain.data.altitudeMinProc, 0.02).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.altitudeMinProc = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addNumber("altMaxProc ", this.terrain.data.altitudeMaxProc, 0.02).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.altitudeMaxProc = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addNumber("altOceanProc ", this.terrain.data.altitudeOceanProc, 0.001).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.altitudeOceanProc = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addNumber("pointsToGen ", this.terrain.data.pointsToGen, 500).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.pointsToGen = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addNumber("noiseSeed ", this.terrain.data.noiseSeed, 0.0001).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.noiseSeed = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addCheckButton("noiseApplyAbs ", this.terrain.data.noiseApplyAbs)[0].addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.noiseApplyAbs = event.data.event.target.checked; this.genFromExistingPlanet();
        })
        genTab.addNumber("noiseFrequency ", this.terrain.data.noiseFrequency, 0.25).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.noiseFrequency = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addNumber("noiseAmplitude ", this.terrain.data.noiseAmplitude, 0.1).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.noiseAmplitude = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addNumber("noisePersistence ", this.terrain.data.noisePersistence, 0.1).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.noisePersistence = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addNumber("noiseOctaves ", this.terrain.data.noiseOctaves, 1).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.noiseOctaves = event.data.event.target.value; this.genFromExistingPlanet();
        })
        genTab.addNumber("noiseExponent1 ", this.terrain.data.noiseExponent1, 0.1).addEventListener(jData.jMng, "change", (event: WorkerEvent) => {
            this.terrain.data.noiseExponent1 = event.data.event.target.value; this.genFromExistingPlanet();
        })


        setMainContainer(this.worker, this.workerJguiMain)
    }


}