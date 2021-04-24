

import * as d3 from "d3"
import { WorkerEvent } from "../modules/Config";
import { randomAlphabetString } from "../utils/Random";


type jguiListen = {
    name: string,
    id: string,
}

export class JguiMake {

    tag: string = null;
    attr: any = {};
    style: any = {};
    html: JguiMake[] | string = null;
    listeners: jguiListen[];

    constructor(tag_: string) {
        this.tag = tag_;
        this.genId();
    }

    // just for convenience
    public get id(): string { return this.attr.id; }
    public set id(value: string) { this.attr.id = value; }
    public get class(): string { return this.attr.class; }
    public set class(value: string) { this.attr.class = value; }
    public get type(): string { return this.attr.type; }
    public set type(value: string) { this.attr.type = value; }

    public mkWorkerJgui(id: string, order: string): [JguiMake, JguiMake] {
        this.tag = "div";
        this.id = id;
        this.class = "d-grid gap-1 bg-light border shadow-sm rounded ";
        // this.style.zIndex = "200";
        // this.style.position = "fixed";
        // this.style.top = "10px";
        // this.style.left = "10px";
        // this.style.width = "256px";
        this.attr.jguiOrder = order;


        var coll = this.addColapse(id, true)

        return [this, coll];
    }

    public mkContainer(): JguiMake {
        // https://getbootstrap.com/docs/5.0/layout/containers/
        this.tag = "div";
        this.class = "d-grid gap-1 bg-light border shadow-sm rounded ";
        return this;
    }



    public mkButton(name: string, type = "primary"): JguiMake {
        // https://getbootstrap.com/docs/5.0/components/buttons/
        this.tag = "button";
        // this.listeners = "click";
        this.attr.class = `btn btn-${type} btn-sm`;
        this.attr.type = "button";
        this.html = name;
        this.style["padding"] = "0" //  no padding

        return this;
    }

    public addButton(btnName: string): JguiMake {
        // https://getbootstrap.com/docs/5.0/components/buttons/
        var btnObj = new JguiMake(null).mkButton(btnName)
        this.appendHtml(btnObj)
        return btnObj;
    }


    public add2Buttons(btnName1: string, btnName2: string): [JguiMake, JguiMake] {
        // https://getbootstrap.com/docs/5.0/components/buttons/

        var rowObj = new JguiMake(null).mkRow()
        var btnObj1 = new JguiMake(null).mkButton(btnName1)
        var btnObj2 = new JguiMake(null).mkButton(btnName2)

        btnObj1.style.width = "50%";
        btnObj2.style.width = "50%";

        rowObj.appendHtml(btnObj1)
        rowObj.appendHtml(btnObj2)
        this.appendHtml(rowObj)
        return [btnObj1, btnObj2];
    }


    public addCheckButton(chboxName: string, chboxVal: boolean): [JguiMake, JguiMake] {
        // https://getbootstrap.com/docs/5.0/forms/checks-radios/

        var cdiv = new JguiMake("div")

        var cswitch = new JguiMake("input")
        cswitch.type = "checkbox"
        cswitch.class = "form-check-input"
        // cswitch.attr.autocomplete = "off"

        if (chboxVal)
            cswitch.attr.checked = "true"

        var cbutton = new JguiMake("label")
        cbutton.class = "form-check-label"
        cbutton.attr.for = cswitch.id
        cbutton.html = chboxName

        cdiv.appendHtml(cswitch)
        cdiv.appendHtml(cbutton)
        this.appendHtml(cdiv)

        return [cswitch, cbutton];
    }

    // public addCheckButton(chboxName: string, value: boolean): [JguiMake, JguiMake] {
    //     // https://getbootstrap.com/docs/5.0/forms/checks-radios/
    //     var cswitch = new JguiMake("input")
    //     cswitch.type = "checkbox"
    //     cswitch.class = "btn-check"
    //     cswitch.attr.autocomplete = "off"

    //     if (value)
    //         cswitch.attr.checked = null

    //     var cbutton = new JguiMake("label")
    //     cbutton.class = "btn btn-outline-primary"
    //     cbutton.attr.for = cswitch.id
    //     cbutton.html = chboxName

    //     this.appendHtml(cswitch)
    //     this.appendHtml(cbutton)

    //     return [cswitch, cbutton];
    // }

    public add2CheckButtons(chboxName1: string, chboxVal1: boolean, chboxName2: string, chboxVal2: boolean): [JguiMake, JguiMake] {
        // https://getbootstrap.com/docs/5.0/forms/checks-radios/
        var cdiv = new JguiMake(null).mkRow()


        var swArr1 = cdiv.addCheckButton(chboxName1, chboxVal1)
        var swArr2 = cdiv.addCheckButton(chboxName2, chboxVal2)

        this.appendHtml(cdiv)

        return [swArr1[0], swArr2[0]];
    }


    public mkColapse(name: string, expanded): JguiMake {
        // https://getbootstrap.com/docs/5.0/components/collapse/
        this.tag = "div";

        // this.class = "collapse";
        // this.class = "collapse gap-1 bg-light border shadow-sm rounded  ";
        this.class = "collapse gap-1 card card-body";

        if (expanded)
            this.class += " show";

        this.genId();

        this.style["padding-top"] = "0.1rem"
        this.style["padding-left"] = "0.4rem"
        this.style["padding-bottom"] = "0px"
        this.style["padding-right"] = "0px"

        return this;
    }


    public addColapse(colName: string, expanded = false): JguiMake {
        // https://getbootstrap.com/docs/5.0/components/collapse/
        // https://getbootstrap.com/docs/5.0/components/card/
        var btnName = `Toggle ${colName}`

        var btnObj = new JguiMake(null).mkButton(btnName, "secondary")
        var colObj = new JguiMake(null).mkColapse(colName, expanded)

        btnObj.genId()
        // btnObj.attr["data-bs-toggle"] = "button"
        btnObj.attr["data-bs-toggle"] = "collapse"
        btnObj.attr["aria-expanded"] = `false`
        btnObj.attr["data-bs-target"] = `#${colObj.id}`
        btnObj.attr["aria-controls"] = `${colObj.id}`

        this.appendHtml(btnObj)
        this.appendHtml(colObj)
        return colObj;
    }

    public mkRow(): JguiMake {
        // https://getbootstrap.com/docs/5.0/utilities/flex/
        this.tag = "div";
        // this.class = "row align-items-start";
        this.class = "d-flex flex-row bd-highlight";
        return this;
    }



    public addSlider(slideName: string, min: number, max: number, step: number): JguiMake {
        // https://getbootstrap.com/docs/5.0/forms/range/
        // <label for= "customRange3" class= "form-label" > Example range < /label>
        // < input type = "range" class="form-range" min = "0" max = "5" step = "0.5" id = "customRange3" >

        // var rowObj = new JguiMake(null).mkRow()
        var labelObj = new JguiMake("label").genId()
        var rangeObj = new JguiMake("input").genId()

        labelObj.tag = "label"
        labelObj.attr.for = `${rangeObj.id}`
        labelObj.attr.class = "form-label"
        labelObj.html = `${slideName}`
        labelObj.style.margin = "0"

        rangeObj.tag = `input`
        rangeObj.attr.type = `range`
        rangeObj.attr.class = `form-range`
        rangeObj.attr.min = `${min}`
        rangeObj.attr.max = `${max}`
        rangeObj.attr.step = `${step}`
        rangeObj.style.margin = "0"
        rangeObj.style["padding-left"] = "0.5rem"
        rangeObj.style["padding-right"] = "0.5rem"

        rangeObj.attr.oninput = `${labelObj.id}.innerHTML="${slideName} "+value`

        // rangeObj.listeners = `input`
        // rangeObj.listeners = `change`
        // rangeObj.listeners = `oninput`

        this.appendHtml(labelObj)
        this.appendHtml(rangeObj)
        // rowObj.appendHtml(labelObj)
        // rowObj.appendHtml(rangeObj)
        // this.appendHtml(rowObj)


        return rangeObj;
    }



    public addNumber(numName: string, numValue: number): JguiMake {
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
        var rowObj = new JguiMake(null).mkRow()
        var numObj = new JguiMake("input")

        numObj.attr.type = "number"
        numObj.attr.value = numValue
        numObj.style.width = "100%"

        rowObj.addLabel(numName)
        rowObj.appendHtml(numObj)

        this.appendHtml(rowObj)

        return numObj;
    }


    public addColor(colName: string, colValue: string): JguiMake {
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
        var rowObj = new JguiMake(null).mkRow()
        var colObj = new JguiMake("input")
        colObj.attr.type = "color"
        colObj.attr.value = colValue
        colObj.style.width = "100%"

        rowObj.addLabel(colName)
        rowObj.appendHtml(colObj)

        this.appendHtml(rowObj)

        return colObj;
    }


    public addLabel(labName: string): JguiMake {
        // https://getbootstrap.com/docs/5.0/forms/floating-labels/
        // var labObj = new JguiMake("div")
        // labObj.class = "d-inline-flex p-2 bd-highlight";

        var labObj = new JguiMake("label")

        labObj.html = labName;
        labObj.style["padding-right"] = "0.5rem"

        this.appendHtml(labObj)
        return labObj;
    }




    public genId() {
        var bid = randomAlphabetString(5)
        this.id = `${this.tag}${bid}`
        return this;
    }

    public appendHtml(elem: JguiMake) {
        if (!this.html) this.html = [];
        (this.html as JguiMake[]).push(elem)
        // return
    }

    public appendListener(elem: any) {
        if (!this.listeners) this.listeners = [];
        this.listeners.push(elem)
        // return
    }



    public addEventListener(evMng: JguiManager, evName: string, listenerCbk: (event: WorkerEvent) => void) {
        // TODO maybe option to not pass the Event to move less data ???
        var jListen: jguiListen = {
            name: evName,
            id: `${evName}-${this.id}.${randomAlphabetString(6)}` // TODO could be better
        }
        evMng.registerListener(jListen.id, listenerCbk)
        this.appendListener(jListen)

        return this;
    }


}



export class JguiManager {
    public worker: Worker
    public workerName: string

    listenersJguiMap = new Map<string, any>();

    constructor(worker: Worker, workerName: string) {
        this.worker = worker;
        this.workerName = workerName;
    }

    public registerListener(lisId: string, listenerCbk: any) {
        this.listenersJguiMap.set(lisId, listenerCbk);
    }

    public dispachListener(lisId: string, event: WorkerEvent) {
        var lisCbk = this.listenersJguiMap.get(lisId);
        lisCbk(event)
    }


}

