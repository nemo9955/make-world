
import * as Tweakpane from "tweakpane/dist/tweakpane.js"

// https://web.archive.org/web/20200227175632/http://workshop.chromeexperiments.com:80/examples/gui/#1--Basic-Usage
// import * as dat from 'dat.gui';


import { WorldData } from "./WorldData"
import { Config } from "./Config"
import { MainManager } from "./MainManager"


export class WorldGui {
    manager: MainManager;

    pane: Tweakpane;
    constructor() { }

    public init() {
        this.pane = new Tweakpane({
            title: 'Make World',
        });

        this.init_manager()
        this.init_star()
        this.init_plsystem()

        // this.pane.on('change', () => { this.refresh(); });
    }

    public refresh() {
        this.pane.refresh();
        this.manager.write();
    }

    public init_manager() {
        const folder_tp = this.pane.addFolder({ title: 'Manager', });
        folder_tp.addButton({ title: 'Update!' }).on('click', () => {
            this.refresh();
        });
        folder_tp.addInput(this.manager.config, 'update_draw').on('change', () => {
            this.refresh();
        });
        // this.pane.on('change', (value) => {
        //     console.log('changed: ' + String(value));
        // });
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