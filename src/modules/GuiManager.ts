
import * as d3 from "d3"






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



type guiElem = {
    tag: string,
    attr?: {},
    style?: {},
    html?: {}[] | string,
    listeners?: string,
    // listeners?: {} | {}[] | string,
}

type guiJson = guiElem[]

type d3EnterType = d3.Selection<d3.EnterElement, guiElem, HTMLDivElement, unknown>
type d3UpdateType = d3.Selection<d3.BaseType, guiElem, HTMLDivElement, unknown>

var testData: guiJson = [
    {
        tag: "input",
        listeners: "click",
        attr: {
            type: "button",
            id: "12312",
            value: "button AAA",
            class: "btn btn-primary btn-sm ",
        }
    },
    {
        tag: "input",
        listeners: "click",
        attr: {
            class: "btn btn-primary btn-sm",
            type: "button",
            id: "346546",
            value: "button BBB",
        }
    },
    // {
    //     tag: "div",
    //     attr: {
    //         // class: "col",
    //         class: "container",
    //         id: "5sd4f5s4d",
    //     },
    //     html: [
    {
        tag: "div",
        html: "click",
        // style: {
        //     width: "100px",
        // },
        attr: {
            // class: "w-40",
            class: "text-start container",
        }
    },
    {
        tag: "input", // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
        listeners: "input",
        // listeners: "change",
        // style: {
        //     width: "100px",
        // },
        attr: {
            // class: "w-40",
            type: "color",
            id: "g3v56h56y",
            value: "#ff0000",
            name: "color picker",
        }
    },
    //     ],
    // },
    // {
    //     tag: "br",
    // },
    {
        tag: "input",
        listeners: "click",
        attr: {
            type: "button",
            id: "6785678",
            value: "button CCC",
            class: "btn btn-primary btn-sm",
        }
    },
    // {
    //     tag: "br",
    // },
]


export class GuiManager {
    container: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> = null;

    constructor() {
        this.container = d3.select("body")
            // .append("div")
            // .attr("class", "border")
            .append("div")
            // .attr("class", "container")
            // .attr("class", "container bg-light border shadow-sm rounded ")
            .attr("class", "d-grid gap-1 bg-light border shadow-sm rounded ")
            // .attr("class", "d-grid gap-1 col-6 mx-auto")
            // .attr("class", "row")
            .style("zIndex", "200")
            .style("position", "fixed")
            .style("top", "10px")
            .style("left", "10px")
            .style("width", "256px")


        // var selectElem: HTMLElement = this.slectPane.containerElem_
        // selectElem.className = "SelectionDiv"
        // selectElem.style.zIndex = "200"
        // selectElem.style.position = "fixed"
        // selectElem.style.bottom = "0px"
        // selectElem.style.right = "0px"
        // selectElem.style.width = "256px"



        setTimeout(() => { this.test1(); }, 1000);
    }

    private getId(d) {
        return `${d?.tag}-${d?.attr?.id}`
    }


    private addTag(datum: guiElem, index: number, groups: any[]) {
        var domElem = groups[index]
        var d3Elem = d3.select(domElem)
        if (typeof datum?.listeners == "string")
            d3Elem.on(datum.listeners, (event: any, datEv: any) => {
                console.log("event", event);
                // console.log("datEv", datEv);
            })



    }

    private setTag(datum: guiElem, index: number, groups: any[]) {
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
            console.log("datum", datum);
            var dat = d3Elem
                .selectChildren("*")
                .data(datum.html, this.getId)
            dat.enter().call(this.enterSelectTags.bind(this))
            dat.exit().call(this.exitSelectTags.bind(this))
        }
        // else if (typeof datum?.html == "object") {
        // }
    }

    private removeTag(datum: guiElem, index: number, groups: any[]) {
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
















    test1() {
        var dat = this.container.selectChildren("*")
            .data(testData, this.getId)
        // .join(
        //     enter => enter.call(this.addTag.bind(this)),
        //     update => { update.each(this.setTag.bind(this)); return update; },
        //     remove => remove.call(this.removeTag.bind(this))
        // )
        dat.enter().call(this.enterSelectTags.bind(this))
        dat.exit().call(this.exitSelectTags.bind(this))

        setTimeout(() => { this.test2(); }, 1000);
    }

    test2() {
        testData.push({
            tag: "input",
            listeners: "click",
            attr: {
                type: "button",
                id: "afgasdfg",
                value: "button DDD",
                class: "btn btn-primary btn-sm",
            }
        })

        var dat = this.container.selectChildren("*")
            .data(testData, this.getId)
        dat.enter().call(this.enterSelectTags.bind(this))
        dat.exit().call(this.exitSelectTags.bind(this))

        setTimeout(() => { this.test3(); }, 1000);
    }

    test3() {
        testData.shift();
        console.log("testData", testData);

        var dat = this.container.selectChildren("*")
            .data(testData, this.getId)
        dat.enter().call(this.enterSelectTags.bind(this))
        dat.exit().call(this.exitSelectTags.bind(this))
    }

}