
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as Units from "../utils/Units"

import { DataBaseManager } from "./DataBaseManager"
import { WorldData } from "./WorldData"
import { DrawThreePlsys } from "./DrawThreePlsys"

import { Config, MessageType } from "./Config"
import { Intervaler, Ticker } from "../utils/Time"
import { SharedData } from "./SharedData";
import { WorkerDOM } from "../utils/WorkerDOM";
import { DrawD3Plsys } from "./DrawD3Plsys";
import { DrawD3Terrain } from "./DrawD3Terrain";
import { MainManager } from "./MainManager";
import type GenericWorkerInstance from "worker-loader!./Generic.worker.ts";
import { OrbitingElement } from "../generate/OrbitingElement";
import { PlanetarySystem } from "../generate/PlanetarySystem";


const SCROLL_THING_SIZE = 20

export interface DrawWorkerInstance {
    readonly type: string;
    sharedData: SharedData;
    world: WorldData;
    canvasOffscreen: OffscreenCanvas;
    config: Config;
    fakeDOM: WorkerDOM;

    updateShallow(): void;
    init(event: MessageEvent): void;
    updateDeep(): void;
    draw(): void;
}

export class DrawWorker {
    public readonly type = this.constructor.name;
    sharedData = new SharedData();
    db_read_itv = new Intervaler();
    world: WorldData = null;
    config: Config = null;
    worker: Worker = null;
    ticker: Ticker = null;

    mapDraws = new Map<any, DrawWorkerInstance>();
    listDraws: DrawWorkerInstance[] = null;
    drawThreePlsys: DrawThreePlsys = null;
    drawD3Plsys: DrawD3Plsys = null;
    drawD3Terrain: DrawD3Terrain = null;
    planetarySystem: PlanetarySystem = null;


    constructor(worker: Worker) {
        this.worker = worker;

        this.world = new WorldData(this.type);
        this.config = new Config();
        this.drawThreePlsys = new DrawThreePlsys();
        this.drawD3Plsys = new DrawD3Plsys();
        this.drawD3Terrain = new DrawD3Terrain();
        this.listDraws = [this.drawThreePlsys, this.drawD3Plsys, this.drawD3Terrain];
        this.ticker = new Ticker(false, this.refreshTick.bind(this), Units.LOOP_INTERVAL, Units.LOOP_INTERVAL * 0.6)
    }

    public init() {
        this.spread_objects();
        this.world.initWorker().then(() => {
            this.worker.postMessage({ message: MessageType.MakeCanvas });
        })
    }


    public spread_objects() {
        // TODO make generic function ???
        this.world.planetarySystem.id = this.config.WorldPlanetarySystemID

        var to_spread: any[] = [this.world, ...this.listDraws]
        for (const object_ of to_spread) {
            if (object_.planetarySystem === null) object_.planetarySystem = this.planetarySystem;
            if (object_.config === null) object_.sharedData = this.sharedData;
            if (object_.config === null) object_.config = this.config;
            if (object_.world === null) object_.world = this.world;
        }
    }


    public get_message(event: MessageEvent) {
        // console.debug("#HERELINE DrawWorker get_message ", event.data.message);
        if (event?.data?.config && this.config)
            this.config.copy(event.data.config as Config)

        const message_ = (event.data.message as MessageType);
        switch (message_) {
            case MessageType.InitWorker:
                this.init(); break;
            case MessageType.Pause:
                this.pause(); break;
            case MessageType.InitCanvas:
                this.init_canvas(event); break;
            case MessageType.RefreshDBDeep:
            case MessageType.RefreshDBShallow:
                this.refreshDb(event, message_); break;
            case MessageType.RefreshConfig:
                this.refreshConfig(); break;
            case MessageType.Event:
                this.callEvent(event.data.event, event.data.event_id); break;
            default:
                console.warn("DEFAULT not implemented !"); break
        }
    }


    callEvent(event: any, event_id: any) {
        // console.log("event_id, event", event_id, event);
        var drawRedirect = this.mapDraws.get(event_id);
        drawRedirect.fakeDOM.dispatchEvent(event);
    }

    public init_canvas(event: MessageEvent) {
        console.debug("#HERELINE DrawWorker init_canvas ", event.data.canvas_id);

        switch (event.data.canvas_id) {
            case "DrawThreePlsysCanvas":
                this.drawThreePlsys.init(event);
                this.mapDraws.set(event.data.canvas_id, this.drawThreePlsys);
                break;
            case "DrawD3PlsysCanvas":
                this.drawD3Plsys.init(event);
                this.mapDraws.set(event.data.canvas_id, this.drawD3Plsys);
                break;
            case "DrawD3TerrainCanvas":
                this.drawD3Terrain.init(event);
                this.mapDraws.set(event.data.canvas_id, this.drawD3Terrain);
                break;
            default:
                console.error("DEFAULT not implemented !", this, event);
                break
        }

        if (this.listDraws.every(canv_ => canv_.canvasOffscreen)) {
            this.worker.postMessage({ message: MessageType.Ready, from: this.type });
        }
    }

    public async pause() {
        this.ticker.stop();
    }

    public async refreshConfig() {
        this.ticker.updateState(this.config.do_draw_loop && this.config.globalIsReady)
    }

    public async refreshDb(event: MessageEvent, refreshType: MessageType) {
        console.debug(`#HERELINE ${this.type} refreshDb ${refreshType}`);
        console.time(`#time ${this.type} refreshDb ${refreshType} `);

        await this.refreshConfig();
        var doSpecial = false;

        var prom: Promise<void> = null
        if (refreshType == MessageType.RefreshDBDeep)
            prom = this.refreshDeep(doSpecial)
        if (refreshType == MessageType.RefreshDBShallow)
            prom = this.refreshShallow(doSpecial)

        await prom.finally(() => {
            console.timeEnd(`#time ${this.type} refreshDb ${refreshType} `);
        })
    }

    private async refreshDeep(doSpecial = true) {
        console.debug("#HERELINE DrawWorker refreshDeep");
        await this.world.readDeep();
        this.planetarySystem = this.world.planetarySystem;
        this.listDraws.forEach(draw_ => draw_.updateDeep());
        if (doSpecial)
            this.listDraws.forEach(draw_ => draw_.draw());
    }

    private async refreshShallow(doSpecial = true) {
        // console.debug("#HERELINE DrawWorker refreshShallow");
        await this.world.readShallow();
        this.listDraws.forEach(draw_ => draw_.updateShallow());
        if (doSpecial)
            this.listDraws.forEach(draw_ => draw_.draw());
    }

    private async refreshTick(doSpecial = true) {
        // console.debug("#HERELINE DrawWorker refreshShallow");
        await this.world.readShallow();
        if (doSpecial)
            this.listDraws.forEach(draw_ => draw_.draw());
    }

    public static initDrawWorkerCanvas(mngr: MainManager, the_worker: GenericWorkerInstance, event: MessageEvent) {
        DrawWorker.initD3Stats(mngr, the_worker, event, "DrawD3TerrainCanvas");
        DrawWorker.initThreePlsysReal(mngr, the_worker, event);
        DrawWorker.initD3Stats(mngr, the_worker, event, "DrawD3PlsysCanvas");

        // mngr.focusableThings[1].focus();
    }


    private static initThreePlsysReal(mngr: MainManager, the_worker: GenericWorkerInstance, event: MessageEvent) {
        var body = document.getElementsByTagName("body")[0];
        body.style.margin = "0"
        const canvas = document.createElement('canvas');
        canvas.id = "DrawThreePlsysCanvas";
        canvas.tabIndex = 0; // so canvas can get keydown events
        // canvas.style.position = "absolute";
        // canvas.style.zIndex = "8";
        // canvas.style.border = "1px solid";
        // const div_ = document.createElement('div'); body.appendChild(div_); mngr.viewableThings.push(div_);
        body.appendChild(canvas);
        mngr.viewableThings.push(canvas);

        // Disable middle click scroll https://stackoverflow.com/a/30423436/2948519
        // document.body.onmousedown = function (e) { if (e.button === 1) return false; }
        canvas.onmousedown = function (e) { if (e.button === 1) return false; }

        // TODO TMP needs to have initial size set
        canvas.width = window.innerWidth - SCROLL_THING_SIZE;
        canvas.height = window.innerHeight;
        // canvas.focus();

        // console.log("canvas", canvas);
        // "mousedown" "mouseenter" "mouseleave" "mousemove" "mouseout" "mouseover" "mouseup":
        canvas.addEventListener('mousemove', (evt) => {
            var rect = canvas.getBoundingClientRect();
            mngr.sharedData.mousex = evt.clientX - rect.left;
            mngr.sharedData.mousey = evt.clientY - rect.top;
        }, false);
        canvas.addEventListener('mouseleave', () => {
            mngr.sharedData.mousex = null;
            mngr.sharedData.mousey = null;
        }, false);

        var canvasOffscreen = canvas.transferControlToOffscreen();
        var canvasResize = () => {
            var fakeResizeEvent: any = new Event("resize");
            fakeResizeEvent.width = window.innerWidth - SCROLL_THING_SIZE
            fakeResizeEvent.height = window.innerHeight
            canvas.dispatchEvent(fakeResizeEvent);

            // canvasOffscreen.width = fakeResizeEvent.width;
            // canvasOffscreen.height = fakeResizeEvent.height;

            // console.log("initThreePlsysReal canvas", canvas);
        }
        // window.addEventListener('resize', canvasResize.bind(this));
        window.addEventListener('resize', canvasResize);
        canvasResize();

        var selectListener = (evt_: Event) => {
            evt_.preventDefault();
            canvas.focus()
            if (mngr.sharedData.selectedId !== mngr.sharedData.hoverId) {

                var selected = mngr.world.idObjMap.get(mngr.sharedData.hoverId)
                mngr.gui.selectOrbElement(selected as OrbitingElement);
            }
        };
        canvas.addEventListener("contextmenu", selectListener.bind(mngr));

        // TODO have a more dynamic ID-based way of propagating events
        mngr.evmng.addOrbitCtrlEvents(canvas, canvas.id, the_worker)
        mngr.evmng.addResizeEvents(canvas, canvas.id, the_worker)

        the_worker.postMessage({
            message: MessageType.InitCanvas,
            config: mngr.config,
            canvas: canvasOffscreen,
            canvas_id: canvas.id,
        }, [canvasOffscreen]);
    }

    private static initD3Stats(mngr: MainManager, the_worker: GenericWorkerInstance, event: MessageEvent, useId: string) {

        var body = document.getElementsByTagName("body")[0];
        body.style.margin = "0"
        const canvas = document.createElement('canvas');
        canvas.id = useId;
        // canvas.style.position = "absolute";
        canvas.tabIndex = 0; // so canvas can get keydown events
        // canvas.style.zIndex = "8";
        // canvas.style.border = "1px solid";
        // const div_ = document.createElement('div'); body.appendChild(div_); mngr.viewableThings.push(div_);
        body.appendChild(canvas);
        mngr.viewableThings.push(canvas);

        // Disable middle click scroll https://stackoverflow.com/a/30423436/2948519
        // document.body.onmousedown = function (e) { if (e.button === 1) return false; }
        canvas.onmousedown = function (e) { if (e.button === 1) return false; }

        // TODO TMP needs to have initial size set
        canvas.width = window.innerWidth - SCROLL_THING_SIZE;
        canvas.height = window.innerHeight;
        // canvas.focus();

        var canvasOffscreen = canvas.transferControlToOffscreen();
        var canvasResize = () => {
            // canvasOffscreen.width = window.innerWidth - SCROLL_THING_SIZE;
            // canvasOffscreen.height = window.innerHeight;

            // canvas.width = canvasOffscreen.width
            // canvas.height = canvasOffscreen.height

            var fakeResizeEvent: any = new Event("resize");
            fakeResizeEvent.width = window.innerWidth - SCROLL_THING_SIZE;
            fakeResizeEvent.height = window.innerHeight;
            canvas.dispatchEvent(fakeResizeEvent);
            // console.log("initD3Stats canvas", canvas);
        }
        // window.addEventListener('resize', canvasResize.bind(this));
        window.addEventListener('resize', canvasResize);
        canvasResize();

        var selectListener = (evt_: Event) => {
            canvas.focus();
            evt_.preventDefault();
        };
        canvas.addEventListener("contextmenu", selectListener.bind(mngr));

        mngr.evmng.addEventsD3Canvas(canvas, canvas.id, the_worker)
        mngr.evmng.addResizeEvents(canvas, canvas.id, the_worker)

        the_worker.postMessage({
            message: MessageType.InitCanvas,
            config: mngr.config,
            canvas: canvasOffscreen,
            canvas_id: canvas.id,
        }, [canvasOffscreen]);
    }


}