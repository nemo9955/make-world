



import GenericWorkerInstance from "worker-loader!./GenWorkerInstance.ts";
import { MessageType, MetaCanvas, WorkerPacket } from "../modules/Config";

import { throttle } from 'lodash-es';
import { MainManager } from "../modules/MainManager";

const BASIC_OBJECTS = ["number", "boolean", "string"]


// Add posibility for this value to be altered per-event optionally
const THROTTHE_TIME = 50;


/*

https://bl.ocks.org/pkerpedjiev/32b11b37be444082762443c4030d145d D3 event filtering
The red circles don't allow scroll-wheel zooming and drag-based panning

*/


export function getBasicEvent(source_: any) {
    var target_: any = {}
    for (const key in source_) {
        var type_ = typeof source_[key]
        if (BASIC_OBJECTS.includes(type_) == false) continue
        // console.log("key", key, type_);
        target_[key] = source_[key];
    }

    if (typeof source_.target == "object") {
        target_.target = {}
        for (const key in source_.target) {
            var type_ = typeof source_.target[key]
            if (BASIC_OBJECTS.includes(type_) == false) continue
            // console.log("key", key, type_);
            target_.target[key] = source_.target[key];
        }
    }

    return target_
}


export function addRightClickStuff(metaCanvas: MetaCanvas, mngr: MainManager, the_worker: GenericWorkerInstance, canvas: HTMLCanvasElement): void {
    var event_name = "contextmenu";
    var rightClick = (evt_) => {

        canvas.focus(); // special for contextmenu
        evt_.preventDefault(); // special for contextmenu

        var basic_event = getBasicEvent(evt_)
        basic_event["event_id"] = canvas.id;
        // console.log("event_name, event", event_name, basic_event);
        the_worker.postMessage(<WorkerPacket>{
            message: MessageType.Event,
            event_id: canvas.id,
            event: basic_event,
        });
    }

    canvas.addEventListener(event_name, rightClick);
}



export function genericRedirect(event_name: string, canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
    // console.log("event_name", event_name);

    var throttled = throttle((evt_) => {
        var basic_event = getBasicEvent(evt_)
        basic_event["event_id"] = canvas_id;
        // console.log("event_name, event", event_name, basic_event);
        worker.postMessage(<WorkerPacket>{
            message: MessageType.Event,
            event_id: canvas_id,
            event: basic_event,
        });
    }, THROTTHE_TIME)

    canvas.addEventListener(event_name, throttled);
}

export function genericConditionalRedirect(event_name: string, canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance, eventCondition: any) {
    // console.log("event_name", event_name);

    var throttled = throttle((evt_) => {
        if (eventCondition(evt_) == false) return;

        var basic_event = getBasicEvent(evt_)
        basic_event["event_id"] = canvas_id;
        // console.log("event_name, event", event_name, basic_event);
        worker.postMessage(<WorkerPacket>{
            message: MessageType.Event,
            event_id: canvas_id,
            event: basic_event,
        });
    }, THROTTHE_TIME)

    canvas.addEventListener(event_name, throttled);
}

export function conditionalRedirect(event_do: string, event_in: string, event_out: string, canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
    var throttled = throttle((evt_) => {
        var basic_event = getBasicEvent(evt_)
        basic_event["event_id"] = canvas_id;
        // console.log("event_do, event", event_do, basic_event);
        worker.postMessage(<WorkerPacket>{
            message: MessageType.Event,
            event_id: canvas_id,
            event: basic_event,
        });
    }, THROTTHE_TIME)

    canvas.addEventListener(event_in, (evt_) => {
        var basic_event = getBasicEvent(evt_)
        basic_event["event_id"] = canvas_id;
        // console.log("event_in, event", event_in, basic_event);
        canvas.addEventListener(event_do, throttled); ///////////////////
        worker.postMessage(<WorkerPacket>{
            message: MessageType.Event,
            event_id: canvas_id,
            event: basic_event,
        });
    });

    canvas.addEventListener(event_out, (evt_) => {
        var basic_event = getBasicEvent(evt_)
        basic_event["event_id"] = canvas_id;
        // console.log("event_out, event", event_out, basic_event);
        canvas.removeEventListener(event_do, throttled); ///////////////////
        worker.postMessage(<WorkerPacket>{
            message: MessageType.Event,
            event_id: canvas_id,
            event: basic_event,
        });
    });
}

export function isShiftPressed(event_: any): boolean {
    return Boolean(event_.shiftKey);
}

export function addResizeEvents(canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
    genericRedirect("resize", canvas, canvas_id, worker)
}


export function addOrbitCtrlEvents(canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
    // disable right-click context on canvas ... TODO do cool stuff !!!!
    // canvas.addEventListener("contextmenu", (evt_) => { evt_.preventDefault() });
    /////// "mousedown" "mouseenter" "mouseleave" "mousemove" "mouseout" "mouseover" "mouseup":
    // genericRedirect("keydown", canvas, canvas_id, worker)

    // genericRedirect("pointermove", canvas, canvas_id, worker)
    genericRedirect("mousemove", canvas, canvas_id, worker)
    // genericRedirect("mouseleave", canvas, canvas_id, worker)

    conditionalRedirect("pointermove", "pointerdown", "pointerup", canvas, canvas_id, worker)
    genericConditionalRedirect("wheel", canvas, canvas_id, worker, isShiftPressed.bind(this))

    // conditionalRedirect("touchmove", "touchstart", "touchend", canvas, canvas_id, worker)
    // canvas.addEventListener('touchstart', onTouchStart, false);
    // canvas.addEventListener('touchend', onTouchEnd, false);
    // canvas.addEventListener('touchmove', onTouchMove, false);

    // canvas.addEventListener('contextmenu', onContextMenu, false);
    // canvas.addEventListener('pointerdown', onPointerDown, false);
    // canvas.addEventListener('keydown', onKeyDown, false);
    // canvas.addEventListener('wheel', onMouseWheel, false);

}

export function addEventsD3Canvas(canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
    // genericRedirect("pointerdown", canvas, canvas_id, worker)
    // genericRedirect("pointerup", canvas, canvas_id, worker)

    // genericRedirect("dblclick", canvas, canvas_id, worker)
    // genericRedirect("mousedown", canvas, canvas_id, worker)
    genericConditionalRedirect("wheel", canvas, canvas_id, worker, isShiftPressed.bind(this))
    // genericRedirect("selectstart", canvas, canvas_id, worker)


    // conditionalRedirect("pointermove", "pointerdown", "pointerup", canvas, canvas_id, worker)
    conditionalRedirect("mousemove", "mousedown", "mouseup", canvas, canvas_id, worker)
    // genericRedirect("mousemove", canvas, canvas_id, worker)
    // genericRedirect("mousedown", canvas, canvas_id, worker)
    // genericRedirect("mouseup", canvas, canvas_id, worker)

}
