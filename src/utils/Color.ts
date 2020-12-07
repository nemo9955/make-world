
import * as THREE from "three";
import * as d3 from "d3"

export class Color {
    private _color: d3.RGBColor;
    r: number;
    g: number;
    b: number;
    a: number;

    constructor() {
        this.r = 255
        this.g = 255
        this.b = 255
        this.a = 1
    }

    public set(value: string) {
        this.color = d3.color(value) as d3.RGBColor
        // console.log("this.value", this.value);

    }


    public get color(): d3.RGBColor {
        return this._color;
    }
    public set color(value: d3.RGBColor) {
        this._color = value;
        this.r = this._color.r;
        this.g = this._color.g;
        this.b = this._color.b;
    }


}