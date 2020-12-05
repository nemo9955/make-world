
import * as THREE from "three";
import * as d3 from "d3"

export class Color {
    private value: d3.RGBColor;

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
        this.value = d3.color(value) as d3.RGBColor
        // console.log("this.value", this.value);

        this.r = this.value.r;
        this.g = this.value.g;
        this.b = this.value.b;
    }

}