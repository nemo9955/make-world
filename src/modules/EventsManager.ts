



import GenericWorkerInstance from "worker-loader!./Generic.worker.ts";
import { MessageType } from "./Config";

const BASIC_OBJECTS = ["number", "boolean", "string"]


/*

https://bl.ocks.org/pkerpedjiev/32b11b37be444082762443c4030d145d D3 event filtering
The red circles don't allow scroll-wheel zooming and drag-based panning

*/


export class EventsManager {

    // TODO add IDs to events and use them to determine the worker and FakeDOM to receive events


    constructor() {

    }

    getBasicEvent(source_: any) {
        var target_ = {}
        for (const key in source_) {
            var type_ = typeof source_[key]
            if (BASIC_OBJECTS.includes(type_) == false) continue
            // console.log("key", key, type_);
            target_[key] = source_[key];
        }
        return target_
    }


    genericRedirect(event_name: string, canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
        // console.log("event_name", event_name);
        canvas.addEventListener(event_name, (evt_) => {
            var basic_event = this.getBasicEvent(evt_)
            basic_event["event_id"] = canvas_id;
            // console.log("event_name, event", event_name, basic_event);
            worker.postMessage({
                message: MessageType.Event,
                event_id: canvas_id,
                event: basic_event,
            });
        });
    }

    genericConditionalRedirect(event_name: string, canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance, eventCondition: any) {
        // console.log("event_name", event_name);
        canvas.addEventListener(event_name, (evt_) => {
            if (eventCondition(evt_) == false) return;

            var basic_event = this.getBasicEvent(evt_)
            basic_event["event_id"] = canvas_id;
            // console.log("event_name, event", event_name, basic_event);
            worker.postMessage({
                message: MessageType.Event,
                event_id: canvas_id,
                event: basic_event,
            });
        });
    }

    conditionalRedirect(event_do: string, event_in: string, event_out: string, canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
        var ev_do_fun = (evt_) => {
            var basic_event = this.getBasicEvent(evt_)
            basic_event["event_id"] = canvas_id;
            // console.log("event_do, event", event_do, basic_event);
            worker.postMessage({
                message: MessageType.Event,
                event_id: canvas_id,
                event: basic_event,
            });
        }

        canvas.addEventListener(event_in, (evt_) => {
            var basic_event = this.getBasicEvent(evt_)
            basic_event["event_id"] = canvas_id;
            // console.log("event_in, event", event_in, basic_event);
            canvas.addEventListener(event_do, ev_do_fun); ///////////////////
            worker.postMessage({
                message: MessageType.Event,
                event_id: canvas_id,
                event: basic_event,
            });
        });

        canvas.addEventListener(event_out, (evt_) => {
            var basic_event = this.getBasicEvent(evt_)
            basic_event["event_id"] = canvas_id;
            // console.log("event_out, event", event_out, basic_event);
            canvas.removeEventListener(event_do, ev_do_fun); ///////////////////
            worker.postMessage({
                message: MessageType.Event,
                event_id: canvas_id,
                event: basic_event,
            });
        });
    }

    public isShiftPressed(event_: any): boolean {
        return Boolean(event_.shiftKey);
    }

    public addResizeEvents(canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
        this.genericRedirect("resize", canvas, canvas_id, worker)
    }


    public addOrbitCtrlEvents(canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {

        // disable right-click context on canvas ... TODO do cool stuff !!!!
        // canvas.addEventListener("contextmenu", (evt_) => { evt_.preventDefault() });

        // this.genericRedirect("keydown", canvas, canvas_id, worker)

        // TODO maybe limit somehow the amount of events (pointermove,touchmove) being sent ???
        this.conditionalRedirect("pointermove", "pointerdown", "pointerup", canvas, canvas_id, worker)
        this.genericConditionalRedirect("wheel", canvas, canvas_id, worker, this.isShiftPressed.bind(this))

        // this.conditionalRedirect("touchmove", "touchstart", "touchend", canvas, canvas_id, worker)
        // canvas.addEventListener('touchstart', onTouchStart, false);
        // canvas.addEventListener('touchend', onTouchEnd, false);
        // canvas.addEventListener('touchmove', onTouchMove, false);

        // canvas.addEventListener('contextmenu', onContextMenu, false);
        // canvas.addEventListener('pointerdown', onPointerDown, false);
        // canvas.addEventListener('keydown', onKeyDown, false);
        // canvas.addEventListener('wheel', onMouseWheel, false);

    }

    public addEventsD3Canvas(canvas: HTMLElement, canvas_id: any, worker: GenericWorkerInstance) {
        // this.genericRedirect("pointerdown", canvas, canvas_id, worker)
        // this.genericRedirect("pointerup", canvas, canvas_id, worker)

        // this.genericRedirect("dblclick", canvas, canvas_id, worker)
        // this.genericRedirect("mousedown", canvas, canvas_id, worker)
        this.genericConditionalRedirect("wheel", canvas, canvas_id, worker, this.isShiftPressed.bind(this))
        // this.genericRedirect("selectstart", canvas, canvas_id, worker)


        // this.conditionalRedirect("pointermove", "pointerdown", "pointerup", canvas, canvas_id, worker)
        this.conditionalRedirect("mousemove", "mousedown", "mouseup", canvas, canvas_id, worker)
        // this.genericRedirect("mousemove", canvas, canvas_id, worker)
        // this.genericRedirect("mousedown", canvas, canvas_id, worker)
        // this.genericRedirect("mouseup", canvas, canvas_id, worker)

    }

}