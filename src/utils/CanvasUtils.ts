import { MainManager } from "../modules/MainManager";
import type GenericWorkerInstance from "worker-loader!./GenWorkerInstance.ts";
import { OrbitingElement } from "../generate/OrbitingElement";
import { WorkerEvent, MetaCanvas, MessageType, WorkerPacket } from "../modules/Config";


import * as EventUtils from "./EventUtils";

export const SCROLL_THING_SIZE = 20;




export function makeWorkerCanvas(mngr: MainManager, the_worker: GenericWorkerInstance, event: WorkerEvent) {
    var metaCanvas = event.data.metaCanvas

    var canvas = addCanvas(metaCanvas, mngr, the_worker)
    sortExistingElements(metaCanvas, mngr, the_worker)
    addMouseSharedBuffer(metaCanvas, mngr, the_worker, canvas); // TODO proper mouse sharedData
    addResizeListener(metaCanvas, mngr, the_worker, canvas);
    EventUtils.addRightClickStuff(metaCanvas, mngr, the_worker, canvas);

    mngr.viewableThings.push(canvas);

    // TODO have a more dynamic ID-based way of propagating events

    if (metaCanvas.generalFlags.includes("orbit"))
        EventUtils.addOrbitCtrlEvents(canvas, canvas.id, the_worker)


    if (metaCanvas.generalFlags.includes("d3"))
        EventUtils.addEventsD3Canvas(canvas, canvas.id, the_worker)


    var canvasOffscreen = canvas.transferControlToOffscreen();
    the_worker.postMessage(<WorkerPacket>{
        message: MessageType.CanvasReady,
        config: mngr.config,
        metaCanvas: metaCanvas,
        canvas: canvasOffscreen,
        canvas_id: canvas.id,
    }, [canvasOffscreen]);

}




function addMouseSharedBuffer(metaCanvas: MetaCanvas, mngr: MainManager, the_worker: GenericWorkerInstance, canvas: HTMLCanvasElement): void {
    // console.log("canvas", canvas);
    // // "mousedown" "mouseenter" "mouseleave" "mousemove" "mouseout" "mouseover" "mouseup":
    // if (metaCanvas.generalFlags.includes("orbit")) {
    //     canvas.addEventListener('mousemove', (evt) => {
    //         var rect = canvas.getBoundingClientRect();
    //         mngr.sharedData.mousex = evt.clientX - rect.left;
    //         mngr.sharedData.mousey = evt.clientY - rect.top;
    //     }, false);
    //     canvas.addEventListener('mouseleave', () => {
    //         mngr.sharedData.mousex = null;
    //         mngr.sharedData.mousey = null;
    //     }, false);
    // }
}

function addResizeListener(metaCanvas: MetaCanvas, mngr: MainManager, the_worker: GenericWorkerInstance, canvas: HTMLCanvasElement): void {

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

    EventUtils.addResizeEvents(canvas, canvas.id, the_worker)
}

function sortExistingElements(metaCanvas: MetaCanvas, mngr: MainManager, the_worker: GenericWorkerInstance): void {

    var body = document.getElementsByTagName("body")[0];
    var stores_li = body.getElementsByTagName("canvas");

    [].slice.call(stores_li).sort(function (a, b) {
        var textA = a.getAttribute('order').toLowerCase()
        var textB = b.getAttribute('order').toLowerCase()
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })
        .forEach(function (el) { el.parentNode.appendChild(el) });

}


function addCanvas(metaCanvas: MetaCanvas, mngr: MainManager, the_worker: GenericWorkerInstance): HTMLCanvasElement {
    var body = document.getElementsByTagName("body")[0];
    body.style.margin = "0"
    const canvas = document.createElement('canvas');
    canvas.id = metaCanvas.id;
    canvas.tabIndex = 0; // so canvas can get keydown events
    canvas.setAttribute('order', metaCanvas.order);
    // canvas.style.position = "absolute";
    // canvas.style.zIndex = "8";
    // canvas.style.border = "1px solid";
    // const div_ = document.createElement('div'); body.appendChild(div_); mngr.viewableThings.push(div_);
    body.appendChild(canvas);

    // Disable middle click scroll https://stackoverflow.com/a/30423436/2948519
    canvas.onmousedown = function (e) { if (e.button === 1) return false; }

    // TODO TMP needs to have initial size set
    // canvas.width = 300;
    // canvas.height = 200;
    canvas.width = window.innerWidth - SCROLL_THING_SIZE;
    canvas.height = window.innerHeight;
    // canvas.focus();
    return canvas;
}


    // export function initDrawWorkerCanvas(mngr: MainManager, the_worker: GenericWorkerInstance, event: WorkerEvent) {
    //     // CanvasManager.initD3Stats(mngr, the_worker, event, "DrawD3TerrainCanvas");
    //     // CanvasManager.initThreePlsysReal(mngr, the_worker, event);
    //     // CanvasManager.initD3Stats(mngr, the_worker, event, "DrawD3PlsysCanvas");
    //     // mngr.focusableThings[1].focus();
    // }

    // function initThreePlsysReal(mngr: MainManager, the_worker: GenericWorkerInstance, event: WorkerEvent) {
    //     var body = document.getElementsByTagName("body")[0];
    //     body.style.margin = "0"
    //     const canvas = document.createElement('canvas');
    //     canvas.id = "DrawThreePlsysCanvas";
    //     canvas.tabIndex = 0; // so canvas can get keydown events
    //     // canvas.style.position = "absolute";
    //     // canvas.style.zIndex = "8";
    //     // canvas.style.border = "1px solid";
    //     // const div_ = document.createElement('div'); body.appendChild(div_); mngr.viewableThings.push(div_);
    //     body.appendChild(canvas);
    //     mngr.viewableThings.push(canvas);

    //     // Disable middle click scroll https://stackoverflow.com/a/30423436/2948519
    //     // document.body.onmousedown = function (e) { if (e.button === 1) return false; }
    //     canvas.onmousedown = function (e) { if (e.button === 1) return false; }

    //     // TODO TMP needs to have initial size set
    //     canvas.width = window.innerWidth - SCROLL_THING_SIZE;
    //     canvas.height = window.innerHeight;
    //     // canvas.focus();

    //     // console.log("canvas", canvas);
    //     // "mousedown" "mouseenter" "mouseleave" "mousemove" "mouseout" "mouseover" "mouseup":
    //     canvas.addEventListener('mousemove', (evt) => {
    //         var rect = canvas.getBoundingClientRect();
    //         mngr.sharedData.mousex = evt.clientX - rect.left;
    //         mngr.sharedData.mousey = evt.clientY - rect.top;
    //     }, false);
    //     canvas.addEventListener('mouseleave', () => {
    //         mngr.sharedData.mousex = null;
    //         mngr.sharedData.mousey = null;
    //     }, false);

    //     var canvasOffscreen = canvas.transferControlToOffscreen();
    //     var canvasResize = () => {
    //         var fakeResizeEvent: any = new Event("resize");
    //         fakeResizeEvent.width = window.innerWidth - SCROLL_THING_SIZE
    //         fakeResizeEvent.height = window.innerHeight
    //         canvas.dispatchEvent(fakeResizeEvent);

    //         // canvasOffscreen.width = fakeResizeEvent.width;
    //         // canvasOffscreen.height = fakeResizeEvent.height;

    //         // console.log("initThreePlsysReal canvas", canvas);
    //     }
    //     // window.addEventListener('resize', canvasResize.bind(this));
    //     window.addEventListener('resize', canvasResize);
    //     canvasResize();

    //     var selectListener = (evt_: Event) => {
    //         canvas.focus()
    //         evt_.preventDefault();
    //         if (mngr.sharedData.selectedId !== mngr.sharedData.hoverId) {

    //             var selected = mngr.world.idObjMap.get(mngr.sharedData.hoverId)
    //             mngr.gui.selectOrbElement(selected as OrbitingElement);
    //         }
    //     };
    //     canvas.addEventListener("contextmenu", selectListener.bind(mngr));

    //     // TODO have a more dynamic ID-based way of propagating events
    //     EventUtils.addOrbitCtrlEvents(canvas, canvas.id, the_worker)
    //     EventUtils.addResizeEvents(canvas, canvas.id, the_worker)

    //     the_worker.postMessage(<WorkerPacket>{
    //         message: MessageType.CanvasReady,
    //         config: mngr.config,
    //         canvas: canvasOffscreen,
    //         canvas_id: canvas.id,
    //     }, [canvasOffscreen]);
    // }

    // function initD3Stats(mngr: MainManager, the_worker: GenericWorkerInstance, event: WorkerEvent, useId: string) {

    //     var body = document.getElementsByTagName("body")[0];
    //     body.style.margin = "0"
    //     const canvas = document.createElement('canvas');
    //     canvas.id = useId;
    //     // canvas.style.position = "absolute";
    //     canvas.tabIndex = 0; // so canvas can get keydown events
    //     // canvas.style.zIndex = "8";
    //     // canvas.style.border = "1px solid";
    //     // const div_ = document.createElement('div'); body.appendChild(div_); mngr.viewableThings.push(div_);
    //     body.appendChild(canvas);
    //     mngr.viewableThings.push(canvas);

    //     // Disable middle click scroll https://stackoverflow.com/a/30423436/2948519
    //     // document.body.onmousedown = function (e) { if (e.button === 1) return false; }
    //     canvas.onmousedown = function (e) { if (e.button === 1) return false; }

    //     // TODO TMP needs to have initial size set
    //     canvas.width = window.innerWidth - SCROLL_THING_SIZE;
    //     canvas.height = window.innerHeight;
    //     // canvas.focus();

    //     var canvasOffscreen = canvas.transferControlToOffscreen();
    //     var canvasResize = () => {
    //         // canvasOffscreen.width = window.innerWidth - SCROLL_THING_SIZE;
    //         // canvasOffscreen.height = window.innerHeight;

    //         // canvas.width = canvasOffscreen.width
    //         // canvas.height = canvasOffscreen.height

    //         var fakeResizeEvent: any = new Event("resize");
    //         fakeResizeEvent.width = window.innerWidth - SCROLL_THING_SIZE;
    //         fakeResizeEvent.height = window.innerHeight;
    //         canvas.dispatchEvent(fakeResizeEvent);
    //         // console.log("initD3Stats canvas", canvas);
    //     }
    //     // window.addEventListener('resize', canvasResize.bind(this));
    //     window.addEventListener('resize', canvasResize);
    //     canvasResize();

    //     var selectListener = (evt_: Event) => {
    //         canvas.focus();
    //         evt_.preventDefault();
    //     };
    //     canvas.addEventListener("contextmenu", selectListener.bind(mngr));

    //     EventUtils.addEventsD3Canvas(canvas, canvas.id, the_worker)
    //     EventUtils.addResizeEvents(canvas, canvas.id, the_worker)

    //     the_worker.postMessage(<WorkerPacket>{
    //         message: MessageType.CanvasReady,
    //         config: mngr.config,
    //         canvas: canvasOffscreen,
    //         canvas_id: canvas.id,
    //     }, [canvasOffscreen]);
    // }


