
import { PlanetarySystem } from "../generate/PlanetarySystem"

import * as Tweakpane from "tweakpane/dist/tweakpane.js"
// import * as Tweakpane from "tweakpane"

// https://web.archive.org/web/20200227175632/http://workshop.chromeexperiments.com:80/examples/gui/#1--Basic-Usage
import * as dat from 'dat.gui';

export class MakeWorld {

    planetary_system: PlanetarySystem;

    constructor() {
        this.planetary_system = new PlanetarySystem();
    }

    /**
     * init
     */
    public init() {
        this.planetary_system.genStar()

        const pane = new Tweakpane();
        const gui = new dat.GUI({ autoPlace: false });
        // var customContainer = document.getElementById('my-gui-container');
        document.body.appendChild(gui.domElement);

        gui.add(gui, 'updateDisplay');
        gui.add(pane, 'refresh');

        var star_gui = gui.addFolder('Star');
        star_gui.open()
        star_gui.add(this.planetary_system.star, 'sclass');
        star_gui.add(this.planetary_system.star, 'mass');
        star_gui.add(this.planetary_system.star, 'luminosity');
        star_gui.add(this.planetary_system.star, 'diameter');
        star_gui.add(this.planetary_system.star, 'radius');
        star_gui.add(this.planetary_system.star, 'temperature');
        star_gui.add(this.planetary_system.star, 'lifetime');
        // star_gui.add(this.planetary_system.star, 'color');
        star_gui.addColor(this.planetary_system.star.color, 'value');


        var plsys_gui = gui.addFolder('Planet System');
        plsys_gui.open()
        plsys_gui.add(this.planetary_system, 'hab_zone_in');
        plsys_gui.add(this.planetary_system, 'hab_zone');
        plsys_gui.add(this.planetary_system, 'hab_zone_out');
        plsys_gui.add(this.planetary_system, 'orbits_limit_in');
        plsys_gui.add(this.planetary_system, 'frost_line');
        plsys_gui.add(this.planetary_system, 'orbits_limit_out');
        plsys_gui.add(this.planetary_system, 'genStar');



        const star_tp = pane.addFolder({ title: 'The Star', });
        star_tp.addInput(this.planetary_system.star, 'sclass');
        star_tp.addInput(this.planetary_system.star, 'mass');
        star_tp.addInput(this.planetary_system.star, 'luminosity');
        star_tp.addInput(this.planetary_system.star, 'diameter');
        star_tp.addInput(this.planetary_system.star, 'radius');
        star_tp.addInput(this.planetary_system.star, 'temperature');
        star_tp.addInput(this.planetary_system.star, 'lifetime');
        star_tp.addInput(this.planetary_system.star.color, 'value');

        const plsys_tp = pane.addFolder({ title: 'Planet System', });
        plsys_tp.addInput(this.planetary_system, 'hab_zone_in');
        plsys_tp.addInput(this.planetary_system, 'hab_zone');
        plsys_tp.addInput(this.planetary_system, 'hab_zone_out');
        plsys_tp.addInput(this.planetary_system, 'orbits_limit_in');
        plsys_tp.addInput(this.planetary_system, 'frost_line');
        plsys_tp.addInput(this.planetary_system, 'orbits_limit_out');
        // plsys_tp.addButton(this.planetary_system, 'genStar');
        plsys_tp.addButton({ title: 'genStar' }).on('click', () => { this.planetary_system.genStar(); pane.refresh() });;
        // plsys_tp.addButton(this.planetary_system.genStar);
    }

}