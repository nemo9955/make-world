


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


const JGUI_ORDINAL = "4"
const WORLD_GEN_ORDER = 401;
const THROTTHE_TIME = 500;


const INITAL_TEXT_VAL = `

outside > door-1
room-1 > door-1 | on:east

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
            .style("width", "98%")
            .style("height", `${heightOffset}px`)
            .on("input", () => { wrapChangeText(null); })

        this.textInput.node().value = INITAL_TEXT_VAL;

        this.canvas = CanvasUtils.makePageCanvas(this.config, this.metaCanvas);
        this.canvas.width = window.innerWidth - CanvasUtils.SCROLL_THING_SIZE;
        this.canvas.height = window.innerHeight - CanvasUtils.SCROLL_THING_SIZE - heightOffset;
        window.addEventListener("resize", (event_) => {
            this.drawObj.resize({
                width: window.innerWidth - CanvasUtils.SCROLL_THING_SIZE,
                height: window.innerHeight - CanvasUtils.SCROLL_THING_SIZE - heightOffset,
            });
        })

        this.drawObj.initPage(this.canvas);

        this.building.init(this.drawObj.scene)

        // setTimeout(() => { this.textChanged(this.textInput.node().value); }, 0);
        this.textChanged(this.textInput.node().value);
    }

    textChanged(text: string) {
        // console.log("text", text);
        this.building.fromText(text);
        this.drawCall();
    }

    drawCall(): void {
        this.drawObj.draw();
        // window.requestAnimationFrame(this.drawCall.bind(this));
    }

}

