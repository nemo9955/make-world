
import * as d3 from "d3"
import { MessageType, WorkerEvent, WorkerPacket } from "../modules/Config";
import { JguiMake } from "./JguiMake"
import GenericWorkerInstance from "worker-loader!./GenWorkerInstance.ts";

import * as EventUtils from "../utils/EventUtils";





// https://web.archive.org/web/20200227175632/http://workshop.chromeexperiments.com:80/examples/gui/#1--Basic-Usage
// import * as dat from 'dat.gui';

// https://www.w3schools.com/colors/colors_picker.asp
// https://www.w3schools.com/tags/att_input_type_color.asp

// https://www.d3-graph-gallery.com/graph/interactivity_button.html
// https://www.d3-graph-gallery.com/graph/interactivity_button.html
// https://www.d3-graph-gallery.com/graph/interactivity_button.html
// https://www.d3-graph-gallery.com/graph/interactivity_button.html
// https://www.d3-graph-gallery.com/graph/interactivity_button.html


// https://getbootstrap.com/docs/5.0/components/buttons/
// https://getbootstrap.com/docs/5.0/components/buttons/
// https://getbootstrap.com/docs/5.0/components/buttons/
// https://getbootstrap.com/docs/5.0/components/buttons/
// https://getbootstrap.com/docs/5.0/components/buttons/


// TODO !!!!!!!!!!!!!!!!!!!
// Parse the GUI as a json to easilly transmit between main <-> worker
// and use D3 to listen for changes to the structure to manage add/change/remove of elemenets
// https://www.d3indepth.com/enterexit/
// https://observablehq.com/@maliky/d3js-enter-update-and-exit
// https://observablehq.com/@d3/selection-join
// https://www.d3indepth.com/enterexit/
// TODO !!!!!!!!!!!!!!!!!!!


// TODO regenerate only affected GUI parts after structural changes
// TODO send shallow read action for simple value changes

// TODO Have no objects always saved in main thread, read from DB and make objects only as they are selected !!!
// This way we can allow workers to manage better the objects without conflicts from others




type d3EnterType = d3.Selection<d3.EnterElement, JguiMake, HTMLDivElement, unknown>
type d3UpdateType = d3.Selection<d3.BaseType, JguiMake, HTMLDivElement, unknown>


export class JsonToGUI {

    allContainer: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> = null;
    mainGuiContainer: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> = null;

    public mainGUI: JguiMake;
    workerJguiMap = new Map<GenericWorkerInstance, JguiMake>();
    listenersJguiMap = new Map<string, GenericWorkerInstance>();

    constructor() {
        this.allContainer = d3.select("body")
            .append("div")
            .attr("id", "allJguiDiv")
            .style("zIndex", "200")
            .style("position", "fixed")
            .style("top", "0px")
            .style("left", "0px")

        this.mainGuiContainer = this.allContainer
            .append("div")
            .attr("class", "d-grid gap-1 bg-light border shadow-sm rounded ")
            .attr("id", "MainWorkerJguiDiv")
            .style("zIndex", "200")
            .style("position", "fixed")
            .style("top", "10px")
            .style("left", "10px")
            .style("width", "200px")
    }


    public refreshJgui(the_worker: GenericWorkerInstance, event: WorkerEvent) {
        var workerJgui = event.data.jgui

        if (event.data.metadata.isMainWorkerContainer) {
            this.workerJguiMap.set(the_worker, workerJgui)
            var allJgui = [...this.workerJguiMap.values()].sort((a, b) => {
                var textA = a.attr.jguiOrder.toLowerCase()
                var textB = b.attr.jguiOrder.toLowerCase()
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            })
            // console.log("allJgui", allJgui);
            var dat = this.mainGuiContainer.selectChildren("*")
                .data(allJgui, this.getId)
            dat.enter().call(this.enterSelectTags.bind(this))
            dat.exit().call(this.exitSelectTags.bind(this))
        }

        this.popJguiListeners(the_worker, workerJgui);
        // console.log("this.listenersJguiMap", this.listenersJguiMap);
    }

    private popJguiListeners(the_worker: GenericWorkerInstance, workerJgui: JguiMake) {
        if (workerJgui?.listeners)
            for (const listen of workerJgui.listeners)
                this.listenersJguiMap.set(listen.id, the_worker)

        if (Array.isArray(workerJgui?.html))
            for (const elem of workerJgui.html)
                this.popJguiListeners(the_worker, elem)
    }


    private getId(d) {
        return `${d?.tag}-${d?.attr?.id}`
    }

    private addTag(jguiMake: JguiMake, index: number, groups: any[]) {
        var domElem: HTMLElement = groups[index]
        var d3Elem = d3.select(domElem)

        if (jguiMake?.listeners)
            for (const listen of jguiMake.listeners) {
                domElem.addEventListener(listen.name, (event: Event) => {
                    // console.log("event", event);
                    var worker = this.listenersJguiMap.get(listen.id);
                    if (worker) {

                        var basicEvent = EventUtils.getBasicEvent(event);
                        worker.postMessage(<WorkerPacket>{
                            message: MessageType.Event,
                            event: basicEvent,
                            event_id: listen.id,
                            jgui: jguiMake,
                            metadata: { isFromJgui: true }
                        });
                    }
                    // console.log(" event.target.value", (event.target as any).value);
                })
                // d3Elem.on(datum.listeners, (event: any, datEv: any) => {
                //     console.log("event", event);
                //     console.log(" event.target.value", (event.target as any).value);
                // })
            }
    }

    private setTag(datum: JguiMake, index: number, groups: any[]) {
        var domElem = groups[index]
        var d3Elem = d3.select(domElem)

        if (datum?.attr)
            for (const key in datum.attr) {
                d3Elem.attr(key, datum.attr[key])
            }

        if (datum?.style)
            for (const key in datum.style) {
                d3Elem.style(key, datum.style[key])
            }

        if (typeof datum?.html == "string")
            d3Elem.html(datum.html)
        else if (Array.isArray(datum?.html)) {
            var dat = d3Elem
                .selectChildren("*")
                .data(datum.html, this.getId)
            dat.enter().call(this.enterSelectTags.bind(this))
            dat.exit().call(this.exitSelectTags.bind(this))
        }
        // else if (typeof datum?.html == "object") {
        // }
    }

    private removeTag(datum: JguiMake, index: number, groups: any[]) {
        var domElem = groups[index]
        var d3Elem = d3.select(domElem)

        console.log(`removeTag .........................`);
        console.log("datum", datum);
        console.log("index", index);
        console.log("groups", groups);
        console.log("elem", domElem);
        console.log("d3elem", d3Elem);
    }

    private enterSelectTags(enter: d3EnterType) {
        enter
            .append(d => document.createElement(d.tag))
            .each(this.addTag.bind(this))
            .call(this.setSelectTags.bind(this))
    }

    private setSelectTags(update: d3UpdateType) {
        return update
            .each(this.setTag.bind(this))
    }

    private exitSelectTags(remove: d3UpdateType) {
        remove.each(console.log)
        remove.remove();
    }







}