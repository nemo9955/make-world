
import GenericWorkerInstance from "worker-loader!./Generic.worker.ts";

const TOTAL_ELEMENTS = 10
const NULL_NUMBER = Number.NEGATIVE_INFINITY

export class SharedData {
    sab: SharedArrayBuffer = null;
    ia: Float64Array = null;

    // TODO setting value to null translates by default to 0 ... in setter/getter translate it to INFINITY or something

    private setNumber(value: number | null): number {
        if (value == null) {
            return NULL_NUMBER;
        }
        return value;
    }

    private getNumber(value: number): number | null {
        if (value == NULL_NUMBER) {
            return null;
        }
        return value;
    }

    private setNumberRaw(value) { return value; }

    private getNumberRaw(value) { return value; }

    public get mousex() { return this.getNumber(this.ia[0]); }
    public set mousex(value) { this.ia[0] = this.setNumber(value); }

    public get mousey() { return this.getNumber(this.ia[1]); }
    public set mousey(value) { this.ia[1] = this.setNumber(value); }

    public get hoverId() { return this.getNumberRaw(this.ia[2]); }
    public set hoverId(value) { this.ia[2] = this.setNumberRaw(value); }
    public get selectedId() { return this.getNumberRaw(this.ia[3]); }
    public set selectedId(value) { this.ia[3] = this.setNumberRaw(value); }

    public get maxId() { return this.getNumberRaw(this.ia[3]); }
    public set maxId(value) { this.ia[3] = this.setNumberRaw(value); }

    constructor() {
    }

    public initMain() {
        this.sab = new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * TOTAL_ELEMENTS);
        this.ia = new Float64Array(this.sab);
        for (const index in this.ia)
            this.ia[index] = NULL_NUMBER;
        this.maxId = 10 ;
    }

    public initShared(sab_: SharedArrayBuffer) {
        this.sab = sab_
        this.ia = new Float64Array(this.sab);
    }


}