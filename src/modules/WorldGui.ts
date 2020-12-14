
import * as Tweakpane from "tweakpane/dist/tweakpane.js"
import * as TweakpaneDummy from "tweakpane"

// https://web.archive.org/web/20200227175632/http://workshop.chromeexperiments.com:80/examples/gui/#1--Basic-Usage
// import * as dat from 'dat.gui';


import { WorldData } from "./WorldData"
import { Config } from "./Config"
import { MainManager } from "./MainManager"

export const REFRESH_CALL_INTERVAL = 100

export class WorldGui {
    manager: MainManager;
    refresh_timeout: any = null;

    pane: Tweakpane;
    constructor() { }

    public init() {
        this.pane = new Tweakpane({
            title: 'Make World',
        });

        this.init_manager()
        this.init_star()
        this.init_plsystem()
    }

    public refresh_instant(skip_pane_refresh = false) {
        // console.log("refresh_instant");
        this.manager.write();
        if (!skip_pane_refresh)
            this.pane.refresh();
    }

    public refresh(skip_pane_refresh = false) {
        // console.log("refresh");
        // A way to call a function once in an interval, but with the last value, not the first
        clearTimeout(this.refresh_timeout);
        this.refresh_timeout = setTimeout(() => {
            this.refresh_instant(skip_pane_refresh)
        }, REFRESH_CALL_INTERVAL);
    }

    public init_manager() {
        const folder_tp = this.pane.addFolder({ title: 'Manager', });
        folder_tp.addButton({ title: 'Update!' }).on('click', () => { this.refresh(); });
        folder_tp.addInput(this.manager.config, 'update_draw').on('change', () => { this.refresh(true); });

        this.pane.on('change', (val1) => {
            this.refresh(true);// Issue with tweakpane color causing recursive refresh
        });
    }

    public init_star() {
        const star_tp = this.pane.addFolder({ title: 'The Star', });
        star_tp.addInput(this.manager.world.planetary_system.star, 'sclass');
        star_tp.addInput(this.manager.world.planetary_system.star, 'mass');
        star_tp.addInput(this.manager.world.planetary_system.star, 'luminosity');
        star_tp.addInput(this.manager.world.planetary_system.star, 'diameter');
        star_tp.addInput(this.manager.world.planetary_system.star, 'radius');
        star_tp.addInput(this.manager.world.planetary_system.star, 'temperature');
        star_tp.addInput(this.manager.world.planetary_system.star, 'lifetime');
        star_tp.addInput(this.manager.world.planetary_system.star.color, 'value');
    }

    public init_plsystem() {
        const plsys_tp = this.pane.addFolder({ title: 'Planet System', });
        plsys_tp.addInput(this.manager.world.planetary_system, 'hab_zone_in');
        plsys_tp.addInput(this.manager.world.planetary_system, 'hab_zone');
        plsys_tp.addInput(this.manager.world.planetary_system, 'hab_zone_out');
        plsys_tp.addInput(this.manager.world.planetary_system, 'orbits_limit_in');
        plsys_tp.addInput(this.manager.world.planetary_system, 'frost_line');
        plsys_tp.addInput(this.manager.world.planetary_system, 'orbits_limit_out');

        plsys_tp.addButton({ title: 'genStar' }).on('click', () => {
            this.manager.world.planetary_system.genStar();
            this.refresh();
        });

    }

}