


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



const INITAL_TEXT_VAL_SM1 = `
room-1 > door-30 | ang:0 sides:42
room-3 > door-30 | ang:0 ld:1

room-1 > door-40 | ang:180 ld:0.4
room-4 > door-40 | ang:45 sides:4

room-4 > door-41 | ang:120 sides:5
room-5 > door-41 | ang:10

room-5 > door-51 | ang:222 ld:1
room-6 > door-51 | ang:0 sides:6

room-1 > door-20 | ang:240
room-2 > door-20 | ang:0   ld:2 elev:0%  sides:3 height:4
room-2 > door-21 | ang:120 ld:3 elev:50%
room-2 > door-22 | ang:240 ld:4 elev:3.7m


room-21 > door-21 | ang:0 elev:2m rh:3m sides:6
room-22 > door-22 | ang:0 elev:3.7m rh:6m sides:6
`;



const INITAL_TEXT_VAL_SM2 = `

default | ld:2 rh:2

room1 > door10 | ang:4,0,30
room1 > door11 | ang:4,0,50
room1 > door12 | ang:4,0,100

room2 > door20 | ang:4,1,30
room2 > door21 | ang:4,2,30
room2 > door22 | ang:4,3,30
room2 > door23 | ang:4,4,30

room3 > door30 | ang:4,0,1
room3 > door31 | ang:4,0,33
room3 > door32 | ang:4,0,66
room3 > door33 | ang:4,0,99
room3 > door36 | ang:4,2,50

default | sides:6
// h/H sub or add half a side for cases where0 is in the middle

room4 > door40 | ang:h6,6,1 rh:10
room4 > door41 | ang:h6,6,33
room4 > door42 | ang:h6,0,66
room4 > door43 | ang:h6,0,99
room4 > door44 | ang:h6,2,50 elev:0
room4 > door45 | ang:h6,2,50 elev:4
room4 > door46 | ang:h6,2,50 elev:8

room44 > door44
room45 > door45
room46 > door46

`;

const INITAL_TEXT_VAL_SM3 = `
default | ld:0.1 rh:2.5

hallway > outlink | ang:180 rw:2 rd:4

hallway > link0 | ang:east ld:1
// closset > link0 | ang:west rw:5 rd:4 // js comments work
closset > link0 | ang:north rw:4 rd:5

hallway > link1 | ang:0
living > link1 | ang:h4,1,0  rw:6 rd:8

`;


const INITAL_TEXT_VAL_SM4 = `// https://www.artstation.com/artwork/XBVyl
default | ld:0.1 rh:2

dining > outlink | ang:180 rw:3 rd:4 rh:2.5

dining > din-for | ang:0 elev:0.5
forge > din-for | ang:0  rw:4 rd:4

forge > for-mil | ang:122
mill > for-mil | ang:west  rw:2 rd:1.5

// making link depth negative will make it go in reverse

forge > for-mine | ang:60  ld:-0.1
mine > for-mine | ang:east rw:1 rd:1 rh:9 elev:5

// TODO make a more proper reverse mechanism
default | rh:1.5

forge > main-stair | ang:278  ld_:-0.1
stairs > main-stair | ang:0    rw:3 rd:1 rh:5

stairs > sec-stair | ang:30  ld_:-0.1 elev:2
upforge > sec-stair | ang:0  rw:4 rd:4

stairs > tri-stair | ang:30  ld_:-0.1 elev:3.5
secret > tri-stair | ang:0  rw:4 rd:4 rh:1

upforge > uf-slp | ang:90
sleep > uf-slp | ang:0 rw:3 rd:4


upforge > upfor-mil | ang:212
upmill > upfor-mil | ang:west  rw:2 rd:1.5


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
        const heightOffset = 200
        const heightOffsetCanvas = 30

        var wrapChangeText = debounce((evt_) => { this.textChanged(this.textInput.node().value); }, THROTTHE_TIME);

        const body = d3.select("body");


        body.append("input").attr("type", "button")
            .attr("class", "btn btn-secondary btn-sm").attr("value", "small1")
            .on("click", () => { this.textInput.node().value = INITAL_TEXT_VAL_SM1; wrapChangeText(null); })

        body.append("input").attr("type", "button")
            .attr("class", "btn btn-secondary btn-sm").attr("value", "small2")
            .on("click", () => { this.textInput.node().value = INITAL_TEXT_VAL_SM2; wrapChangeText(null); })

        body.append("input").attr("type", "button")
            .attr("class", "btn btn-secondary btn-sm").attr("value", "small3")
            .on("click", () => { this.textInput.node().value = INITAL_TEXT_VAL_SM3; wrapChangeText(null); })
        body.append("input").attr("type", "button")
            .attr("class", "btn btn-secondary btn-sm").attr("value", "small4")
            .on("click", () => { this.textInput.node().value = INITAL_TEXT_VAL_SM4; wrapChangeText(null); })

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

        this.textInput = body.append("textarea")
            // .attr("order", "0")
            .style("width", "70%")
            .style("height", `${heightOffset}px`)
            .on("input", () => { wrapChangeText(null); })

        this.textInput.node().value = INITAL_TEXT_VAL_SM4;

        this.canvas = CanvasUtils.makePageCanvas(this.config, this.metaCanvas);
        this.canvas.width = window.innerWidth - CanvasUtils.SCROLL_THING_SIZE;
        this.canvas.height = window.innerHeight - CanvasUtils.SCROLL_THING_SIZE - heightOffset - heightOffsetCanvas;
        window.addEventListener("resize", (event_) => {
            this.drawObj.resize({
                width: window.innerWidth - CanvasUtils.SCROLL_THING_SIZE,
                height: window.innerHeight - CanvasUtils.SCROLL_THING_SIZE - heightOffset - heightOffsetCanvas,
            });
        })

        // window.addEventListener('keydown', (event) => { this.drawObj.controls.enableZoom = event.shiftKey; });
        // window.addEventListener('keyup', (event) => { this.drawObj.controls.enableZoom = event.shiftKey; });

        this.drawObj.initPage(this.canvas);
        // this.drawObj.controls.enableZoom = false;

        this.building.init(this.drawObj.scene)


        // setTimeout(() => { this.textChanged(this.textInput.node().value); }, 0);
        this.textChanged(this.textInput.node().value);
        this.building.adaptCamera(this.drawObj.camera, this.drawObj.controls)
        this.drawCall();


        // this.building.printGlobJson(); // DEBUGGING !!!!!!!!!!!!!!!
    }

    textChanged(text: string) {
        // console.log("text", text);
        this.building.fromText(text);
        // this.building.placeIgnoreLinks([...this.building.allRooms.values()]);
        this.building.placeRespectLinks()
        // this.building.adaptCamera(this.drawObj.camera, this.drawObj.controls)
        // this.drawCall();
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
                tst += `\nroom-${index} > door-${dorin} | ang:${Math.random() * 360}`;
                tst += `\nroom-${Math.max(0, index - randClampInt(0, 4))} > door-${dorin}  | ang:${randClampInt(0, 360)}`;
            }
        }


        return tst

    }


}

