
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



// type d3Thing = d3.Selection<d3.EnterElement, string, HTMLDivElement, unknown>
type d3EnterType = d3.Selection<d3.EnterElement, any, HTMLDivElement, unknown>
type d3UpdateType = d3.Selection<d3.BaseType, any, HTMLDivElement, unknown>


var testData = [
    {
        tag: "input",
        attr: {
            type: "button",
            id: "12312",
            value: "button AAA",
            class: "btn btn-primary btn-sm",
        }
    },
    {
        tag: "input",
        attr: {
            type: "button",
            id: "346546",
            value: "button BBB",
            class: "btn btn-primary btn-sm",
        }
    },
    // {
    //     tag: "br",
    // },
    {
        tag: "input",
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
            .append("div")
            .attr("class", "container")

        setTimeout(() => { this.test1(); }, 1000);
    }

    getId(d) {
        return d?.attr?.id
    }

    test1() {


        var dat = this.container.selectAll("*")
            .data(testData, this.getId)
        // .join(
        //     enter => enter.call(this.addTag.bind(this)),
        //     update => { update.each(this.setTag.bind(this)); return update; },
        //     remove => remove.call(this.removeTag.bind(this))
        // )

        dat.enter().call(this.addTag.bind(this))
        dat.exit().call(this.removeTag.bind(this))

        setTimeout(() => { this.test2(); }, 1000);
    }

    test2() {
        testData.push({
            tag: "input",
            attr: {
                type: "button",
                id: "afgasdfg",
                value: "button DDD",
                class: "btn btn-primary btn-sm",
            }
        })


        var dat = this.container.selectAll("*")
            .data(testData, this.getId)

        dat.enter().call(this.addTag.bind(this))
        dat.exit().call(this.removeTag.bind(this))

        setTimeout(() => { this.test3(); }, 1000);
    }

    test3() {
        testData.shift();
        console.log("testData", testData);

        var dat = this.container.selectAll("*")
            .data(testData, this.getId)

        dat.enter().call(this.addTag.bind(this))
        dat.exit().call(this.removeTag.bind(this))
    }



    public addTag(enter: d3EnterType) {
        console.log("enter", enter);
        enter
            .append(d => document.createElement(d.tag)) // https://stackoverflow.com/questions/28485046/d3-append-with-function-argument/28485870
            .call(this.setTag.bind(this))
    }


    public setTag(update: d3UpdateType) {
        console.log("update", update);
        return update
            .attr("type", d => d?.attr?.type)
            .attr("class", d => d?.attr?.class)
            .attr("value", d => d?.attr?.value)
            .attr("id", d => d?.attr?.id)
    }

    public removeTag(remove: d3UpdateType) {
        console.log("remove", remove);
        remove.remove();
    }


}