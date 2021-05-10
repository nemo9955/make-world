


const heapify = require("../../node_modules/heapify/heapify.mjs")



import { freeFloat32Array, freeUint32Array, getFloat32Array, getUint32Array } from "../utils/ObjectPool";


export class Heapify {

    heapify: any;

    constructor(capacity: number) {
        const arrCap = Math.ceil((capacity + 10) * 1.3)
        this.heapify = new heapify.default(1, [], [], Uint32Array, Float32Array);
        this.heapify._keys = getUint32Array(arrCap);
        this.heapify._priorities = getFloat32Array(arrCap);
        this.heapify._capacity = capacity;
    }

    /**
     * @param {*} key the identifier of the object to be pushed into the heap
     * @param {Number} priority 32-bit value corresponding to the priority of this key
     */
    push(key: number, priority: number): void {
        this.heapify.push(key, priority);
    }
    pop(): number {
        return this.heapify.pop();
    }
    peekPriority(): number {
        return this.heapify.peekPriority();
    }
    peekValue(): number {
        return this.heapify.peekPriority();
    }
    peekKey(): number {
        return this.heapify.peek();
    }
    peek(): number {
        return this.heapify.peek();
    }
    clear(): void {
        this.heapify.clear();
    }
    dumpRawPriorities(): string {
        return this.heapify.dumpRawPriorities();
    }

    get length() { return this.heapify.size; }
    get size() { return this.heapify.size; }
    get capacity() { return this.heapify.capacity; }

    free(): void {
        freeUint32Array(this.heapify._keys);
        freeFloat32Array(this.heapify._priorities);
    }

}