
import * as Tweakpane from "tweakpane/dist/tweakpane.js"
import * as TweakpaneDummy from "tweakpane"
import * as d3 from "d3"

import { WorldData } from "./WorldData"
import { Config, MessageType, WorkerEvent } from "./Config"
import { MainManager } from "./MainManager"
import { Intervaler } from "../utils/Time"
import * as Convert from "../utils/Convert"
import { OrbitingElement } from "../generate/OrbitingElement"
import { Planet } from "../generate/Planet"
import { Star } from "../generate/Star"
import { DrawD3Terrain } from "./DrawD3Terrain"
import { JsonToGUI } from "../gui/JsonToGUI"

export const REFRESH_CALL_INTERVAL = 200


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
// TODO !!!!!!!!!!!!!!!!!!!


// TODO regenerate only affected GUI parts after structural changes
// TODO send shallow read action for simple value changes

// TODO Have no objects always saved in main thread, read from DB and make objects only as they are selected !!!
// This way we can allow workers to manage better the objects without conflicts from others


export class WorldGui {
    manager: MainManager;
    refresh_inval: Intervaler;

    mainPane: Tweakpane;
    slectPane: Tweakpane;
    orbits_tp: any


    constructor() {
        this.manager = null;
        this.refresh_inval = new Intervaler();

    }


    public init() {
        this.mainPane = new Tweakpane({
            title: 'Make World',
        });

        var MailElem: HTMLElement = this.mainPane.containerElem_
        MailElem.style.zIndex = "100"; // put GUI at the front
        MailElem.style.top = "0px"
        MailElem.style.right = "0px"
        MailElem.style.position = "fixed";

        this.initSelection()

        this.init_manager()
        // this.init_star()
        this.init_plsystem()
    }

    private initSelection() {
        this.slectPane = new Tweakpane({
            title: '!!!contextmenu issue!!!',
        });
        var selectElem: HTMLElement = this.slectPane.containerElem_
        selectElem.className = "SelectionDiv"
        selectElem.style.zIndex = "200";
        selectElem.style.position = "fixed"
        selectElem.style.bottom = "0px"
        selectElem.style.right = "0px"
        selectElem.style.width = "256px"

        // this.slectPane.addMonitor(this.manager.sharedData, "hoverId");
        // this.slectPane.addMonitor(this.manager.sharedData, "selectedId");
    }

    public selectOrbElement(orbElem: OrbitingElement) {
        this.slectPane.containerElem_.remove();
        this.slectPane.dispose();
        this.initSelection()
        // this.manager.sharedData.selectedId = null;
        if (!orbElem) return;
        // this.manager.sharedData.selectedId = orbElem.id;

        orbElem.guiSelect(this.slectPane, this);

        // TODO refresh only this element ....
        this.slectPane.on('change', () => this.refreshShallow());
    }

    private clear() {
        this.mainPane.containerElem_.remove();
        this.mainPane.dispose();
        this.slectPane.containerElem_.remove();
        this.slectPane.dispose();
    }

    public regenerate(doRefresh = true) {
        this.clear();
        this.init();
        if (doRefresh)
            this.refreshDeep(true);
    }

    public refreshInstant(skip_pane_refresh, extra: MessageType) {
        // console.debug("#HERELINE WorldGui refresh_instant ");
        var prom_: Promise<void> = null;

        if (extra == MessageType.RefreshDBDeep)
            prom_ = this.manager.writeDeep()
        if (extra == MessageType.RefreshDBShallow)
            prom_ = this.manager.writeShallow()
        if (extra == MessageType.RefreshConfig)
            prom_ = this.manager.refreshConfig()

        prom_.then(() => {
            if (!skip_pane_refresh)
                this.refresh_gui();
        })
    }

    public refresh_gui(skip_pane_refresh = false) {
        console.debug("#HERELINE WorldGui refresh_gui skip_pane_refresh ", skip_pane_refresh);

        // // set all existing inputs as hidden
        // this.orbits_tp.controller.ucList_.items.forEach(element => { element.view.model_.hidden = true; });
        // for (let index = 0; index < this.manager.world.planetary_system.orbits_distances_km.length; index++) {
        //     const dist_ = this.manager.world.planetary_system.orbits_distances_km[index]
        //     var gui_elem_ = this.orbits_tp.controller.ucList_.items[index]
        //     if (gui_elem_)
        //         this.orbits_tp.controller.ucList_.items[index].view.model_.hidden = false;
        //     else
        //         this.orbits_tp.addInput(this.manager.world.planetary_system.orbits_distances_km, index.toString());
        // }

        if (!skip_pane_refresh)
            this.mainPane.refresh();
    }

    public refreshDeep(skip_pane_refresh = false) {
        this.selectOrbElement(null);
        // TODO ignore user input while refresh is in progress !!!
        // if (this.refresh_inval.check(REFRESH_CALL_INTERVAL)) {
        console.debug("#HERELINE WorldGui refreshDeep ");
        this.refreshInstant(skip_pane_refresh, MessageType.RefreshDBDeep);
        // }
    }

    public refreshShallow(skip_pane_refresh = true) {
        // TODO ignore user input while refresh is in progress !!!
        if (this.refresh_inval.check(REFRESH_CALL_INTERVAL)) {
            console.debug("#HERELINE WorldGui refreshShallow ");
            this.refreshInstant(skip_pane_refresh, MessageType.RefreshDBShallow);
        }
    }

    public refreshConfig(skip_pane_refresh = true) {
        // TODO ignore user input while refresh is in progress !!!
        if (this.refresh_inval.check(REFRESH_CALL_INTERVAL)) {
            console.debug("#HERELINE WorldGui refreshConfig ");
            this.refreshInstant(skip_pane_refresh, MessageType.RefreshConfig);
        }
    }


    // dummy: any = {
    //     TEST: 12
    // };

    public init_manager() {
        // const folder_tp = this.mainPane.addFolder({ title: 'Manager', });
        this.mainPane.addButton({ title: 'refreshDeep' }).on('click', () => { this.refreshDeep(); });
        this.mainPane.addButton({ title: 'refreshShallow' }).on('click', () => { this.refreshShallow(); });
        this.mainPane.addButton({ title: 'refreshConfig' }).on('click', () => { this.refreshConfig(); });


        this.mainPane.addInput(this.manager.config, 'follow_pointed_orbit', {
            options: { "none": "none", "imediate": "imediate", "auto": "auto" }
        }).on('change', () => { this.refreshConfig(); });


        DrawD3Terrain.guiMainStatic(this.mainPane, this);

        // this.mainPane.addInput(this.manager.config, 'timeUpdSpeed', { min: 0, step: 0.05 });
        this.mainPane.addInput(this.manager.config, 'timeUpdSpeed', { format: (v: number) => v.toFixed(6) });

        // this.mainPane.addInput(this.dummy, 'TEST',
        //     { format: (v: number) => v.toFixed(6) })
        //     .on('change', (event_) => {
        //         console.log("event_", event_);
        //     });


        this.manager.viewableThings.forEach((elem_, index) => {
            this.mainPane.addButton({ title: `View ${elem_.id}` }).on('click', () => {
                elem_.scrollIntoView();
            });
        });

        this.mainPane.addButton({ title: 'regen' }).on('click', () => {
            this.regenerate();
        });

        this.mainPane.on('change', () => this.refreshShallow());
        // this.mainPane.on('change', () => {
        //     // this.refreshShallow();// Issue with tweakpane color causing recursive refresh
        //     this.refreshConfig();// Issue with tweakpane color causing recursive refresh
        // });
    }

    public init_star() {
        for (let index = 0; index < this.manager.world.planetarySystem.getStars().length; index++) {
            const element = this.manager.world.planetarySystem.getStars()[index];

            const star_tp = this.mainPane.addFolder({ title: `Star ${index}`, expanded: false });
            star_tp.addInput(element, 'sclass');
            star_tp.addInput(element.luminosity, 'watt', { label: "watt" });
            star_tp.addInput(element.temperature, 'kelvin', { label: "kelvin" });
            star_tp.addInput(element.lifetime, 'eby', { label: "life bln" });

            star_tp.addInput(element.mass, 'Yg', { label: "mass" });
            star_tp.addInput(element.radius, 'Mm', { label: "radius" });

            this.mainPane.addInput(element.color, 'value')//.on('change', () => this.refreshDeep(false));
            // star_tp.on('change', () => this.refreshDeep(false));
        }
    }

    public init_plsystem() {


        this.mainPane.addButton({ title: 'Select Planet System' }).on('click', () => {
            this.selectOrbElement(this.manager.world.planetarySystem);
        });




        this.mainPane.addButton({ title: 'genStar' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetarySystem
            this.manager.world.spaceFactory.genStar(plsys, plsys)
            this.regenerate();
        });

        this.mainPane.addButton({ title: 'genPTypeStarts' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetarySystem
            this.manager.world.spaceFactory.genPTypeStarts(plsys, plsys)
            this.regenerate();
        });

        this.mainPane.addButton({ title: 'genOrbitsSimple' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetarySystem
            this.manager.world.spaceFactory.genOrbitsSimple(plsys, plsys.root())
            this.refreshDeep();
        });

        // this.mainPane.addButton({ title: 'genDebugg' }).on('click', () => {
        //     this.manager.pauseAll()
        //     var plsys = this.manager.world.planetary_system
        //     this.manager.world.spaceFactory.genDebugg(plsys, plsys.root())
        //     this.refreshDeep();
        // });
        // this.mainPane.addButton({ title: 'genOrbitsUniform' }).on('click', () => {
        //     this.manager.pauseAll()
        //     var plsys = this.manager.world.planetary_system
        //     this.manager.world.spaceFactory.genOrbitsUniform(plsys, plsys.root())
        //     this.refreshDeep();
        // });

        this.mainPane.addButton({ title: 'genOrbitsSimpleMoons' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetarySystem
            this.manager.world.spaceFactory.genOrbitsSimpleMoons(plsys, plsys.root())
            this.refreshDeep();
        });

        // this.mainPane.addButton({ title: 'Pop out cancas' }).on('click', () => {
        //     console.warn(this, this.manager);
        //     // var dataURL = this.manager.canvasObj.toDataURL("image/png");
        //     // var newTab = window.open(dataURL, 'Image');
        //     // newTab.focus();
        // });

        this.refresh_gui(true)
    }

}