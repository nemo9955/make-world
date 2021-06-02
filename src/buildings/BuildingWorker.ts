import { BaseDrawUpdateWorker, DrawWorkerInstance } from "../modules/GenWorkerMetadata";
import * as Convert from "../utils/Convert"
import * as Units from "../utils/Units"
import { Config, MessageType, WorkerEvent, WorkerPacket, WorldGenType } from "../modules/Config";
import { JguiMake } from "../gui/JguiMake";
import { jguiData, setMainContainer } from "../gui/JguiUtils";
import { Terrain } from "../planet/Terrain";
import { Planet } from "../orbiting_elements/Planet";



const JGUI_ORDINAL = "4"
const WORLD_GEN_ORDER = 401;


export class BuildingWorker extends BaseDrawUpdateWorker {
    public getWorldEvent(event: WorkerEvent): void {
        throw new Error("Method not implemented.");
    }
    public updateInterval(): void {
        throw new Error("Method not implemented.");
    }
    public init(): void {
        throw new Error("Method not implemented.");
    }



}