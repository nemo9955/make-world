
import * as Tweakpane from "tweakpane/dist/tweakpane.js"
import * as TweakpaneDummy from "tweakpane"

// https://web.archive.org/web/20200227175632/http://workshop.chromeexperiments.com:80/examples/gui/#1--Basic-Usage
// import * as dat from 'dat.gui';


import { WorldData } from "./WorldData"
import { Config, MessageType } from "./Config"
import { MainManager } from "./MainManager"
import { Intervaler } from "../utils/Time"
import * as Convert from "../utils/Convert"

export const REFRESH_CALL_INTERVAL = 200

// TODO regenerate only affected GUI parts after structural changes
// TODO send shallow read action for simple value changes


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

    private clear() {
        this.pane.containerElem_.remove();
        this.pane.dispose();
    }

    public regenerate() {
        this.clear()
        this.init()
        this.refreshDeep(true)
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
            this.pane.refresh();
    }

    public refreshDeep(skip_pane_refresh = false) {
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


    public init_manager() {
        // const folder_tp = this.pane.addFolder({ title: 'Manager', });
        this.pane.addButton({ title: 'refreshDeep' }).on('click', () => { this.refreshDeep(); });
        this.pane.addButton({ title: 'refreshShallow' }).on('click', () => { this.refreshShallow(); });
        this.pane.addButton({ title: 'refreshConfig' }).on('click', () => { this.refreshConfig(); });
        this.pane.addInput(this.manager.config, 'do_draw_loop').on('change', () => { this.refreshConfig(); });
        this.pane.addInput(this.manager.config, 'do_update_loop').on('change', () => { this.refreshConfig(); });
        // this.pane.addInput(this.manager.config, 'do_main_loop').on('change', () => { this.refreshConfig(); });
        this.pane.addInput(this.manager.config, 'follow_pointed_orbit').on('change', () => { this.refreshConfig(); });
        this.pane.addInput(this.manager.config, 'timeUpdSpeed', { min: 0, max: 1 });



        this.pane.addButton({ title: 'regen' }).on('click', () => {
            this.regenerate();
        });

        this.pane.on('change', () => this.refreshShallow());
        // this.pane.on('change', () => {
        //     // this.refreshShallow();// Issue with tweakpane color causing recursive refresh
        //     this.refreshConfig();// Issue with tweakpane color causing recursive refresh
        // });
    }

    public init_star() {
        for (let index = 0; index < this.manager.world.planetary_system.getStars().length; index++) {
            const element = this.manager.world.planetary_system.getStars()[index];

            const star_tp = this.pane.addFolder({ title: 'Star ' + index });
            star_tp.addInput(element, 'sclass');
            star_tp.addInput(element.luminosity, 'watt', { label: "watt" });
            star_tp.addInput(element.temperature, 'kelvin', { label: "kelvin" });
            star_tp.addInput(element.lifetime, 'eby', { label: "life bln" });

            star_tp.addInput(element.mass, 'Xg', { label: "mass" });
            star_tp.addInput(element.radius, 'Mm', { label: "radius" });

            this.pane.addInput(element.color, 'value')//.on('change', () => this.refreshDeep(false));
            // star_tp.on('change', () => this.refreshDeep(false));
            star_tp.expanded = false
        }
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
            this.manager.pauseAll()
            var plsys = this.manager.world.planetary_system
            this.manager.world.spaceFactory.genStar(plsys, plsys)
            this.regenerate();
        });

        this.pane.addButton({ title: 'genPTypeStarts' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetary_system
            this.manager.world.spaceFactory.genPTypeStarts(plsys, plsys)
            this.regenerate();
        });

        this.pane.addButton({ title: 'genDebugg' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetary_system
            this.manager.world.spaceFactory.genDebugg(plsys, plsys.root())
            this.refreshDeep();
        });

        this.pane.addButton({ title: 'genOrbitsSimple' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetary_system
            this.manager.world.spaceFactory.genOrbitsSimple(plsys, plsys.root())
            this.refreshDeep();
        });

        this.pane.addButton({ title: 'genOrbitsUniform' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetary_system
            this.manager.world.spaceFactory.genOrbitsUniform(plsys, plsys.root())
            this.refreshDeep();
        });

        this.pane.addButton({ title: 'genOrbitsSimpleMoons' }).on('click', () => {
            this.manager.pauseAll()
            var plsys = this.manager.world.planetary_system
            this.manager.world.spaceFactory.genOrbitsSimpleMoons(plsys, plsys.root())
            this.refreshDeep();
        });

        plsys_tp.expanded = false

        // this.orbits_tp = plsys_tp.addFolder({ title: 'Orbits' });
        // this.orbits_tp.expanded = false
        this.refresh_gui(true)
    }

}