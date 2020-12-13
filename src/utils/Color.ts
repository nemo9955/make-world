
import * as THREE from "three";
import * as d3 from "d3"

class ColorValues {
    r: number = 255;
    g: number = 255;
    b: number = 255;
    opacity: number = 1;

    clone(source_: any) {
        // console.log("ColorValues .... source_", source_);
        if (typeof source_.r !== "undefined")
            this.r = source_.r
        if (typeof source_.g !== "undefined")
            this.g = source_.g
        if (typeof source_.b !== "undefined")
            this.b = source_.b
        if (typeof source_.a !== "undefined")
            this.opacity = source_.a
        if (typeof source_.opacity !== "undefined")
            this.opacity = source_.opacity
    }
}

export class Color {
    // private _color: d3.RGBColor;
    private _value: ColorValues;


    constructor() {
        this._value = new ColorValues();
    }

    clone(source_: any) {
        // console.log("source_", source_);
        if (source_._value)
            this._value.clone(source_._value)
        else
            this._value.clone(source_)
        // console.log("this._value", this._value);
        // console.log("this", this);
    }

    public get r(): number { return this._value.r; }
    public get g(): number { return this._value.g; }
    public get b(): number { return this._value.b; }

    public set(value: string) {
        var color = d3.color(value) as d3.RGBColor
        this._value.clone(color)
    }

    // public set color(value: d3.RGBColor) {
    //     this._color = d3.rgb(value.r, value.g, value.b);
    //     this._value.clone(this._color as any);
    //     console.log("SETTTTTTT this._color", this._color);
    //     console.log("SETTTTTTT this._color.toString()", this._color.toString());
    // }


    public get value(): ColorValues {
        return this._value;
    }
    public set value(value: ColorValues) {
        this._value.clone(value);
        // console.log("SET : this._value", this._value);
        // console.log("SET : this.toString()", this.toString());
    }

    toString(): string {
        return d3.rgb(this.r, this.g, this.b).toString()
    }

}