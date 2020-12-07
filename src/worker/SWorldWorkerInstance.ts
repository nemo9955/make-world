
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

import * as Units from "../utils/Units"

import { SWorldConfig } from "../manage/SWorldManage"
import { SWorldDraw } from "../draw/SWorldDraw"

export class SWorldWorkerInstance {
    draw: SWorldDraw;
    config: SWorldConfig

    constructor() {
        this.draw = new SWorldDraw();
    }

    public init(event: MessageEvent) {
        console.log("event", event);
    }

    public draw_message(event: MessageEvent) {
        this.draw.draw_message(event)
    }

    public get_message(worker: Worker, event: MessageEvent) {
        // console.log("worker", worker);
        switch (event.data.message) {
            case 'init':
                this.init(event)
                break;
            case 'draw':
                this.draw_message(event)
                break;
            case 'set_canvasOffscreen':
                this.draw.canvasOffscreen = event.data.canvas
                break;
        }
    }



}