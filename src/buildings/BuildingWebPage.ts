


import * as CanvasUtils from "../utils/CanvasUtils"
import { generateWords } from "../libs/wordGen";
import { Language as LangRy } from "../libs/naming-language-ryelle";
import { getWord, getName, makeBasicLanguage, makeOrthoLanguage, makeRandomLanguage } from "../libs/naming-language-mewo2";
import { zip } from 'lodash-es';

import * as d3 from "d3"
import { Config, MetaCanvas } from "../modules/Config";
import { BuildingDrawThree } from "./BuildingDrawThree";

import { throttle, debounce } from 'lodash-es';
import { Building } from "./Building";
import { randClampInt } from "../utils/Random";


const JGUI_ORDINAL = "4"
const WORLD_GEN_ORDER = 401;
const THROTTHE_TIME = 500;


const INITAL_TEXT_VAL_SM = `
room-1 > door-30 | on:0 sides:3
room-3 > door-30 | on:0    llen:3

room-1 > door-40 | on:120
room-4 > door-40 | on:0  sides:4

room-1 > door-20 | on:240
room-2 > door-20 | on:0   llen:3
room-2 > door-21 | on:140


room-4 > door-41 | on:180
room-5 > door-41 | on:0  sides:5

room-5 > door-51 | on:222    llen:3
room-6 > door-51 | on:0  sides:6

`;






export class BuildingWebPage {
    static get type() { return `BuildingWebPage` }
    get name() { return `BuildingWebPage` }


    textInput: d3.Selection<HTMLTextAreaElement, unknown, HTMLElement, any>;

    drawObj: BuildingDrawThree;

    config: Config;
    canvas: HTMLCanvasElement;
    building: Building;

    metaCanvas: MetaCanvas = {
        id: `${this.name}-canvas-1`,
        order: JGUI_ORDINAL + "00",
        generalFlags: ["orbit"],
    }

    constructor() {
        this.config = new Config();

        this.drawObj = new BuildingDrawThree();
        this.building = new Building();
    }

    init() {
        var heightOffset = 200

        var wrapChangeText = debounce((evt_) => { this.textChanged(this.textInput.node().value); }, THROTTHE_TIME);

        const body = d3.select("body");
        this.textInput = body.append("textarea")
            // .attr("order", "0")
            .style("width", "70%")
            .style("height", `${heightOffset}px`)
            .on("input", () => { wrapChangeText(null); })

        this.textInput.node().value = INITAL_TEXT_VAL_SM;



        body.append("input").attr("type", "button")
            .attr("class", "btn btn-secondary btn-sm").attr("value", "small")
            .on("click", () => { this.textInput.node().value = INITAL_TEXT_VAL_SM; wrapChangeText(null); })

        body.append("input").attr("type", "button")
            .attr("class", "btn btn-secondary btn-sm").attr("value", "med")
            .on("click", () => { this.textInput.node().value = this.makeRandRoomStr(14); wrapChangeText(null); })

        body.append("input").attr("type", "button")
            .attr("class", "btn btn-secondary btn-sm").attr("value", "big")
            .on("click", () => { this.textInput.node().value = this.makeRandRoomStr(40); wrapChangeText(null); })

        body.append("input").attr("type", "button")
            .attr("class", "btn btn-info btn-sm").attr("value", "LOG")
            .on("click", () => {
                this.building.printGlobJson();
            })



        this.canvas = CanvasUtils.makePageCanvas(this.config, this.metaCanvas);
        this.canvas.width = window.innerWidth - CanvasUtils.SCROLL_THING_SIZE;
        this.canvas.height = window.innerHeight - CanvasUtils.SCROLL_THING_SIZE - heightOffset;
        window.addEventListener("resize", (event_) => {
            this.drawObj.resize({
                width: window.innerWidth - CanvasUtils.SCROLL_THING_SIZE,
                height: window.innerHeight - CanvasUtils.SCROLL_THING_SIZE - heightOffset,
            });
        })

        // this way control will not react to scroll for zooming
        // this.canvas.onscroll = (event) => { this.drawObj.controls.enableZoom = false; };
        // this.canvas.onmousedown = (event) => { this.drawObj.controls.enableZoom = true; };
        window.addEventListener('keydown', (event) => { this.drawObj.controls.enableZoom = event.shiftKey; });
        window.addEventListener('keyup', (event) => { this.drawObj.controls.enableZoom = event.shiftKey; });

        this.drawObj.initPage(this.canvas);
        this.drawObj.controls.enableZoom = false;

        this.building.init(this.drawObj.scene)


        // setTimeout(() => { this.textChanged(this.textInput.node().value); }, 0);
        this.textChanged(this.textInput.node().value);

        // this.building.printGlobJson(); // DEBUGGING !!!!!!!!!!!!!!!
    }

    textChanged(text: string) {
        // console.log("text", text);
        this.building.fromText(text);
        // this.building.placeIgnoreLinks()
        this.building.placeRespectLinks()
        this.building.adaptCamera(this.drawObj.camera, this.drawObj.controls)
        this.drawCall();
    }

    drawCall(): void {
        this.drawObj.draw();
        window.requestAnimationFrame(this.drawCall.bind(this));
    }


    makeRandRoomStr(count: number, lnkCnt = 2) {


        var tst = ``;
        for (let index = 0; index < count; index++) {
            for (let lnkind = 0; lnkind < lnkCnt; lnkind++) {
                var dorin = Math.max(0, index - randClampInt(0, 2))
                tst += `\nroom-${index} > door-${dorin}`;
                tst += `\nroom-${Math.max(0, index - randClampInt(0, 4))} > door-${dorin}`;
            }
        }


        return tst

    }


}

