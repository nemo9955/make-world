
/*
* Used to store and send VERRY simple data across the main thread and workers
*/
import { JguiMake } from "../gui/JguiMake";
import * as Convert from "../utils/Convert"
import { DrawD3Terrain } from "./DrawD3Terrain";


// TODO things to add, with parameters being in SpaceConfig!
// genMainOrbits ... bool ensure_habitable
// // make just the main orbits and add after
// addMoons ... number how_many , bool make_harmonics


export class Config {

    follow_pointed_orbit: "none" | "imediate" | "auto" = "auto";

    globalIsReady: boolean = false; // global flag for when Tickers can run
    timeUpdSpeed = 0.0004;

    genEnsureInHabZone = true;
    genEnsureCenteredInHabZone = true;
    genEnsureMoonInHabZone = true;


    keepDbAtPageRefresh = false; // EXPERIMENTAL
    WORLD_DATABASE_NAME: string = "WORLD-123"; // TODO properly generate at right time


    terrain_geo_view: string = DrawD3Terrain.defaultGeoViews();

    public copy(source_: Config) {
        Convert.copyShallow(this, source_)
        return this;
    }
}


export type WorkerEvent = MessageEvent<WorkerPacket>

export type WorkerPacket = {
    message: MessageType,
    config?: Config,
    jgui?: JguiMake,
    create?: string,
    metaCanvas?: MetaCanvas,
    canvas?: OffscreenCanvas,
    canvas_id?: any,
    sab?: SharedArrayBuffer,
    event?: any,
    event_id?: string,
    metadata?: any,
}

export type MetaCanvas = {
    id: string,
    order: string,
    generalFlags: any[],
}


export enum MessageType {
    Event = "Event",
    Ready = "Ready",
    Play = "Play",
    Pause = "Pause",
    InitWorker = "InitWorker",
    RefreshDBDeep = "RefreshDBDeep",
    RefreshDBShallow = "RefreshDBShallow",
    RefreshConfig = "RefreshConfig",
    CanvasReady = "CanvasReady",
    CanvasMake = "CanvasMake",
    RefreshJGUI = "RefreshJGUI"
}
