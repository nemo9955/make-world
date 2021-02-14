
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as Units from "../utils/Units"

import { DataBaseManager } from "./DataBaseManager"
import { WorldData } from "./WorldData"
import { DrawWorld } from "./DrawWorld"

import { Config, MessageType } from "./Config"
import { Intervaler, Ticker } from "../utils/Time"
import { SharedData } from "./SharedData";
import { WorkerDOM } from "../utils/WorkerDOM";
import { DrawD3Stats } from "./DrawD3Stats";
import { MainManager } from "./MainManager";
import type GenericWorkerInstance from "worker-loader!./Generic.worker.ts";
import { OrbitingElement } from "../generate/OrbitingElement";


const SCROLL_THING_SIZE = 20

export class DrawWorker {
    sharedData = new SharedData();
    drawThreePlsysReal: DrawWorld;
    drawD3Stats: DrawD3Stats;
    db_read_itv = new Intervaler();

    world: WorldData;
    config: Config;

    worker: Worker;

    ticker: Ticker

    constructor(worker: Worker) {
        this.worker = worker;

        this.world = new WorldData("DrawWorker");
        this.config = new Config();
        this.drawThreePlsysReal = new DrawWorld();
        this.drawD3Stats = new DrawD3Stats();
        this.ticker = new Ticker(false, this.refreshShallow.bind(this), Units.LOOP_INTERVAL, Units.LOOP_INTERVAL * 0.6)
    }

    public init() {
        this.spread_objects();
        this.world.initWorker().then(() => {
            this.worker.postMessage({ message: MessageType.MakeCanvas });
        })
    }


    public spread_objects() {
        // TODO make generic function ???
        this.world.planetary_system.id = this.config.WorldPlanetarySystemID

        var to_spread: any[] = [this.world, this.drawThreePlsysReal, this.drawD3Stats]
        for (const object_ of to_spread) {
            if (object_.config === null) object_.sharedData = this.sharedData
            if (object_.config === null) object_.config = this.config
            if (object_.world === null) object_.world = this.world
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
        if (event_id === "DrawThreePlsysRealCanvas")
            this.drawThreePlsysReal.fakeDOM.dispatchEvent(event);
        else
            this.drawD3Stats.fakeDOM.dispatchEvent(event);
    }

    public init_canvas(event?: MessageEvent) {
        console.debug("#HERELINE DrawWorker init_canvas ", event.data.canvas_id);
        if (event.data.canvas_id === "DrawThreePlsysRealCanvas") {
            this.drawThreePlsysReal.canvasOffscreen = event.data.canvas;
            this.drawThreePlsysReal.init()
        } else {
            this.drawD3Stats.canvasOffscreen = event.data.canvas;
            this.drawD3Stats.init()
        }

        var allCanv = [this.drawD3Stats.canvasOffscreen, this.drawThreePlsysReal.canvasOffscreen]
        if (allCanv.every(canv_ => canv_)) {
            this.worker.postMessage({ message: MessageType.Ready, from: "DrawWorker" });
        }
    }

    public async pause() {
        this.ticker.stop();
    }

    public async refreshConfig() {
        this.ticker.updateState(this.config.do_draw_loop && this.config.globalIsReady)
    }

    public async refreshDb(event: MessageEvent, refreshType: MessageType) {
        console.debug("#HERELINE DrawWorker refresh_db ready", refreshType);
        console.time(`#time DrawWorker refresh_db ${refreshType} `);

        await this.refreshConfig();
        var doSpecial = !false;

        var prom: Promise<void> = null
        if (refreshType == MessageType.RefreshDBDeep)
            prom = this.refreshDeep(doSpecial)
        if (refreshType == MessageType.RefreshDBShallow)
            prom = this.refreshShallow(doSpecial)

        await prom.finally(() => {
            console.timeEnd(`#time DrawWorker refresh_db ${refreshType} `);
        })
    }

    private async refreshDeep(doSpecial = true) {
        console.debug("#HERELINE DrawWorker refreshDeep");
        await this.world.readDeep();
        this.drawThreePlsysReal.updateDeep();
        if (doSpecial) {
            this.drawThreePlsysReal.draw();
            this.drawD3Stats.draw();
        }
    }

    private async refreshShallow(doSpecial = true) {
        // console.debug("#HERELINE DrawWorker refreshShallow");
        await this.world.readShallow();
        if (doSpecial) {
            this.drawThreePlsysReal.draw();
            this.drawD3Stats.draw();
        }
    }

    public static initDrawWorkerCanvas(mngr: MainManager, the_worker: GenericWorkerInstance, event: MessageEvent) {
        DrawWorker.initThreePlsysReal(mngr, the_worker, event);
        DrawWorker.initD3Stats(mngr, the_worker, event);
    }


    public static initThreePlsysReal(mngr: MainManager, the_worker: GenericWorkerInstance, event: MessageEvent) {
        var body = document.getElementsByTagName("body")[0];
        body.style.margin = "0"
        const canvas = document.createElement('canvas');
        canvas.id = "DrawThreePlsysRealCanvas";
        canvas.tabIndex = 0; // so canvas can get keydown events
        // canvas.style.position = "absolute";
        // canvas.style.zIndex = "8";
        // canvas.style.border = "1px solid";
        body.appendChild(canvas);
        mngr.focusableThings.push(canvas);

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
            canvasOffscreen.width = window.innerWidth - SCROLL_THING_SIZE;
            canvasOffscreen.height = window.innerHeight;

            var fakeResizeEvent: any = new Event("resize");
            fakeResizeEvent.width = canvasOffscreen.width
            fakeResizeEvent.height = canvasOffscreen.height
            canvas.dispatchEvent(fakeResizeEvent);
            // console.log("initThreePlsysReal canvas", canvas);
        }
        // window.addEventListener('resize', canvasResize.bind(this));
        window.addEventListener('resize', canvasResize);
        canvasResize();

        var selectListener = (evt_: Event) => {
            evt_.preventDefault();
            canvas.focus()
            if (mngr.sharedData.selectedId !== mngr.sharedData.hoverId) {

                var selected = mngr.world.stdBObjMap.get(mngr.sharedData.hoverId)
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

    public static initD3Stats(mngr: MainManager, the_worker: GenericWorkerInstance, event: MessageEvent) {

        var body = document.getElementsByTagName("body")[0];
        body.style.margin = "0"
        const canvas = document.createElement('canvas');
        canvas.id = "DrawD3StatsCanvas";
        // canvas.style.position = "absolute";
        canvas.tabIndex = 0; // so canvas can get keydown events
        // canvas.style.zIndex = "8";
        // canvas.style.border = "1px solid";
        body.appendChild(canvas);
        mngr.focusableThings.push(canvas);

        // Disable middle click scroll https://stackoverflow.com/a/30423436/2948519
        // document.body.onmousedown = function (e) { if (e.button === 1) return false; }
        canvas.onmousedown = function (e) { if (e.button === 1) return false; }

        // TODO TMP needs to have initial size set
        canvas.width = window.innerWidth - SCROLL_THING_SIZE;
        canvas.height = window.innerHeight;
        // canvas.focus();

        var canvasOffscreen = canvas.transferControlToOffscreen();
        var canvasResize = () => {
            canvasOffscreen.width = window.innerWidth - SCROLL_THING_SIZE;
            canvasOffscreen.height = window.innerHeight;

            // canvas.width = canvasOffscreen.width
            // canvas.height = canvasOffscreen.height

            var fakeResizeEvent: any = new Event("resize");
            fakeResizeEvent.width = canvasOffscreen.width
            fakeResizeEvent.height = canvasOffscreen.height
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