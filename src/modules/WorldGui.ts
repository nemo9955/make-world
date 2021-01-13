
import * as Tweakpane from "tweakpane/dist/tweakpane.js"
import * as TweakpaneDummy from "tweakpane"

// https://web.archive.org/web/20200227175632/http://workshop.chromeexperiments.com:80/examples/gui/#1--Basic-Usage
// import * as dat from 'dat.gui';


import { WorldData } from "./WorldData"
import { Config } from "./Config"
import { MainManager } from "./MainManager"
import { Intervaler } from "../utils/Time"
import * as Convert from "../utils/Convert"

export const REFRESH_CALL_INTERVAL = 200

// TODO regenerate WHOLE GUI after world structural changes
// like new stars and orbits
// TODO regenerate only affected GUI parts after structural changes


export class WorldGui {
    manager: MainManager;
    refresh_inval: Intervaler;

    pane: Tweakpane;
    orbits_tp: any


    constructor() {
        this.manager = null;
        this.refresh_inval = new Intervaler();
    }

    public init() {
        this.pane = new Tweakpane({
            title: 'Make World',
        });

        var pane_elem: any = this.pane.containerElem_
        pane_elem.style.zIndex = "100"; // put GUI at the front

        this.init_manager()
        this.init_star()
        this.init_plsystem()
    }

    public refresh_instant(skip_pane_refresh = false) {
        // console.debug("#HERELINE WorldGui refresh_instant ");
        this.manager.write().then(() => {
            if (!skip_pane_refresh)
                this.refresh_gui();
        })
    }

    public refresh_gui(skip_pane_refresh = false) {
        // console.debug("#HERELINE WorldGui refresh_gui   skip_pane_refresh ", skip_pane_refresh);

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
            this.pane.refresh();
    }

    public refresh(skip_pane_refresh = false) {
        // console.debug("#HERELINE WorldGui refresh ");
        if (this.refresh_inval.check(REFRESH_CALL_INTERVAL)) {
            this.refresh_instant(skip_pane_refresh);
        }
    }

    public init_manager() {
        // const folder_tp = this.pane.addFolder({ title: 'Manager', });
        this.pane.addButton({ title: 'Update!' }).on('click', () => { this.refresh(); });
        this.pane.addInput(this.manager.config, 'do_draw_loop').on('change', () => { this.refresh(true); });
        this.pane.addInput(this.manager.config, 'do_update_loop').on('change', () => { this.refresh(true); });
        this.pane.addInput(this.manager.config, 'do_main_loop').on('change', () => { this.refresh(true); });
        this.pane.addInput(this.manager.config, 'timeUpdSpeed', { min: 0, max: 100, });

        this.pane.on('change', (val1) => {
            this.refresh(true);// Issue with tweakpane color causing recursive refresh
        });
    }

    public init_star() {
        const star_tp = this.pane.addFolder({ title: 'The Star' });
        star_tp.addInput(this.manager.world.planetary_system.getStars()[0], 'sclass');
        star_tp.addInput(this.manager.world.planetary_system.getStars()[0].luminosity, 'watt', { label: "watt" });
        star_tp.addInput(this.manager.world.planetary_system.getStars()[0].temperature, 'kelvin', { label: "kelvin" });
        star_tp.addInput(this.manager.world.planetary_system.getStars()[0].lifetime, 'universal', { label: "universal" });
        this.pane.addInput(this.manager.world.planetary_system.getStars()[0].color, 'value');

        star_tp.addInput(this.manager.world.planetary_system.getStars()[0].mass, 'kg', { label: "mass" });
        // star_tp.addInput(this.manager.world.planetary_system.getStars()[0].diameter, 'km', { label: "diameter" });
        star_tp.addInput(this.manager.world.planetary_system.getStars()[0].radius, 'km', { label: "radius" });

        star_tp.expanded = false
    }

    public init_plsystem() {
        const plsys_tp = this.pane.addFolder({ title: 'Planet System' });
        plsys_tp.addInput(this.manager.world.planetary_system.hab_zone_in, 'km', { label: "hab_zone_in" });
        plsys_tp.addInput(this.manager.world.planetary_system.hab_zone, 'km', { label: "hab_zone" });
        plsys_tp.addInput(this.manager.world.planetary_system.hab_zone_out, 'km', { label: "hab_zone_out" });
        plsys_tp.addInput(this.manager.world.planetary_system.orbits_limit_in, 'km', { label: "orbits_limit_in" });
        plsys_tp.addInput(this.manager.world.planetary_system.frost_line, 'km', { label: "frost_line" });
        plsys_tp.addInput(this.manager.world.planetary_system.orbits_limit_out, 'km', { label: "orbits_limit_out" });

        this.pane.addButton({ title: 'genStar' }).on('click', () => {
            this.manager.world.planetary_system.genStar();
            this.manager.world.planetary_system.genOrbitsSimple();
            this.refresh();
        });

        this.pane.addButton({ title: 'genDebugg' }).on('click', () => {
            this.manager.world.planetary_system.genStar("sun");
            this.manager.world.planetary_system.genOrbitsUniform();
            this.refresh();
        });

        this.pane.addButton({ title: 'genOrbitsSimple' }).on('click', () => {
            this.manager.world.planetary_system.genOrbitsSimple(); this.refresh();
        });

        this.pane.addButton({ title: 'genOrbitsUniform' }).on('click', () => {
            this.manager.world.planetary_system.genOrbitsUniform(); this.refresh();
        });

        this.pane.addButton({ title: 'genOrbitsSimpleMoons' }).on('click', () => {
            this.manager.world.planetary_system.genOrbitsSimpleMoons(); this.refresh();
        });

        plsys_tp.expanded = false

        // this.orbits_tp = plsys_tp.addFolder({ title: 'Orbits' });
        // this.orbits_tp.expanded = false
        this.refresh_gui(true)
    }

}