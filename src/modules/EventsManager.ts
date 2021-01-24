



import GenericWorkerInstance from "worker-loader!./Generic.worker.ts";
import { MessageType } from "./Config";

const BASIC_OBJECTS = ["number", "boolean", "string"]

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


    genericRedirect(event_name: string, canvas: HTMLCanvasElement, canvas_id: any, worker: GenericWorkerInstance) {
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

    conditionalRedirect(event_do: string, event_in: string, event_out: string, canvas: HTMLCanvasElement, canvas_id: any, worker: GenericWorkerInstance) {
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

    addOrbitCtrlEvents(canvas: HTMLCanvasElement, canvas_id: any, worker: GenericWorkerInstance) {

        // disable right-click context on canvas ... TODO do cool stuff !!!!
        canvas.addEventListener("contextmenu", (evt_) => { evt_.preventDefault() });

        // this.genericRedirect("keydown", canvas, canvas_id, worker)

        // TODO maybe limit somehow the amount of events (pointermove,touchmove) being sent ???
        this.conditionalRedirect("pointermove", "pointerdown", "pointerup", canvas, canvas_id, worker)

        // this.conditionalRedirect("touchmove", "touchstart", "touchend", canvas, canvas_id, worker)
        // canvas.addEventListener('touchstart', onTouchStart, false);
        // canvas.addEventListener('touchend', onTouchEnd, false);
        // canvas.addEventListener('touchmove', onTouchMove, false);

        // canvas.addEventListener('contextmenu', onContextMenu, false);
        // canvas.addEventListener('pointerdown', onPointerDown, false);
        // canvas.addEventListener('wheel', onMouseWheel, false);
        // canvas.addEventListener('keydown', onKeyDown, false);

    }

}