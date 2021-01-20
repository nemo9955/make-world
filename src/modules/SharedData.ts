
import GenericWorkerInstance from "worker-loader!./Generic.worker.ts";

const TOTAL_ELEMENTS = 10

export class SharedData {
    sab: SharedArrayBuffer = null;
    ia: Int32Array = null;

    // TODO setting value to null translates by default to 0 ... in setter/getter translate it to INFINITY or something

    public get mousex() { return this.ia[0]; }
    public set mousex(value) { this.ia[0] = value; }

    public get mousey() { return this.ia[1]; }
    public set mousey(value) { this.ia[1] = value; }

    constructor() {
    }

    public initMain() {
        this.sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * TOTAL_ELEMENTS);
        this.ia = new Int32Array(this.sab);
    }

    public initShared(sab_: SharedArrayBuffer) {
        this.sab = sab_
        this.ia = new Int32Array(this.sab);
    }


}