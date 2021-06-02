import { WorldWebPage } from "../modules/WorldWebPage";
import type GenericWorkerInstance from "worker-loader!./GenWorkerInstance.ts";
import { OrbitingElement } from "../orbiting_elements/OrbitingElement";
import { WorkerEvent, MetaCanvas, MessageType, WorkerPacket, Config } from "../modules/Config";


import * as EventUtils from "./EventUtils";

export const SCROLL_THING_SIZE = 20;




export function makeWorkerCanvas(config: Config, the_worker: GenericWorkerInstance, event: WorkerEvent) {
    var metaCanvas = event.data.metaCanvas

    var canvas = addCanvas(metaCanvas)
    sortExistingElements(metaCanvas)
    addWorkerResizeListener(metaCanvas, the_worker, canvas);
    EventUtils.addRightClickStuff(metaCanvas, the_worker, canvas);

    // TODO have a more dynamic ID-based way of propagating events

    addWorkerEvents(metaCanvas, canvas, the_worker);


    var canvasOffscreen = canvas.transferControlToOffscreen();
    the_worker.postMessage(<WorkerPacket>{
        message: MessageType.CanvasReady,
        config: config,
        metaCanvas: metaCanvas,
        canvas: canvasOffscreen,
        canvas_id: canvas.id,
    }, [canvasOffscreen]);

}

export function makePageCanvas(config: Config, metaCanvas: MetaCanvas) {
    var canvas = addCanvas(metaCanvas)


    return canvas;
}

function addWorkerEvents(metaCanvas: MetaCanvas, canvas: HTMLCanvasElement, the_worker: GenericWorkerInstance) {
    if (metaCanvas.generalFlags.includes("orbit"))
        EventUtils.addOrbitCtrlEvents(canvas, canvas.id, the_worker);


    if (metaCanvas.generalFlags.includes("d3"))
        EventUtils.addEventsD3Canvas(canvas, canvas.id, the_worker);
}



function addWorkerResizeListener(metaCanvas: MetaCanvas, the_worker: GenericWorkerInstance, canvas: HTMLCanvasElement): void {

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

function sortExistingElements(metaCanvas: MetaCanvas): void {

    var body = document.getElementsByTagName("body")[0];
    var stores_li = body.getElementsByTagName("canvas");

    [].slice.call(stores_li).sort(function (a, b) {
        var textA = a.getAttribute('order').toLowerCase()
        var textB = b.getAttribute('order').toLowerCase()
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })
        .forEach(function (el) { el.parentNode.appendChild(el) });

}


function addCanvas(metaCanvas: MetaCanvas): HTMLCanvasElement {
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
