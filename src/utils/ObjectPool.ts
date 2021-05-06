

// Based on : https://github.com/ecsyjs/ecsy/blob/master/src/ObjectPool.js
// Based on : https://github.com/getify/deePool/blob/master/lib/deePool.src.js
// https://stackoverflow.com/questions/24677592/generic-type-inference-with-class-argument/26696435#26696435
// https://stackoverflow.com/questions/17382143/create-a-new-object-from-type-parameter-in-generic-class


export class ObjectPool<T> {

    freeList: T[];
    count: number;
    isObjectPool: boolean;

    create: () => T;
    reset: (item: T) => void;

    constructor(create_func: () => T, reset_func: (item: T) => void, initialSize?: number) {
        this.create = create_func
        this.reset = reset_func

        this.freeList = [];
        this.count = 0;
        this.isObjectPool = true;
        if (typeof initialSize !== "undefined") {
            this.expand(initialSize);
        }
    }

    public get(): T {
        // Grow the list by 20%ish if we're out
        if (this.freeList.length <= 0) {
            this.expand(Math.round(this.count * 0.2) + 1);
        }

        var item = this.freeList.pop();
        // this.reset(item);

        return item;
    }

    public free(item: T): void {
        if (this.freeList.includes(item)) {
            console.error("Resource freed multiple times", item);
            return;
        }
        // if (typeof item == T) return;
        this.reset(item);
        this.freeList.push(item);
    }

    public expand(count: number): void {
        for (var n = 0; n < count; n++) {
            var clone = this.create();
            // clone._pool = this;
            this.freeList.push(clone);
        }
        this.count += count;
    }

    public totalSize(): number {
        return this.count;
    }

    public totalFree(): number {
        return this.freeList.length;
    }

    public totalUsed(): number {
        return this.count - this.freeList.length;
    }

}



// Int8Array
// Uint8Array
// Uint8ClampedArray
// Int16Array
// Uint16Array
// Int32Array
// Uint32Array
// Float32Array
// Float64Array
// BigInt64Array
// BigUint64Array

type AllTypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array;




function lengthComparator(reverse = false) {
    // https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
    var less: -1 | 1 = -1;
    var great: -1 | 1 = 1;
    if (reverse) {
        less = 1;
        great = - 1;
    }

    return (a: any, b: any) => {
        if (a.length < b.length)
            return less;
        if (a.length > b.length)
            return great;
        return 0;
    }
}

function getExistingArray(minSize: number, maxSize: number, poolArr: AllTypedArray[], existing: AllTypedArray): any {
    if (existing)
        freeToPool(existing, poolArr)

    var minArray = null;
    var minIndex = -1;
    var minLength = maxSize;
    for (let index = 0; index < poolArr.length; index++) {
        const element = poolArr[index];
        if (element.length >= minSize)
            if (element.length < minLength) {
                minArray = element;
                minLength = element.length;
                minIndex = index;
            }
    }
    if (minIndex >= 0) // remove from pool
        poolArr.splice(minIndex, 1);
    return minArray;
}



function freeToPool(arr: AllTypedArray, poolArr: AllTypedArray[]) {
    if (arr == null || arr == undefined) return;
    poolArr.push(arr);
    poolArr.sort(lengthComparator());
    // console.log("freed poolArr", poolArr);
}


const poolInt8Array: Int8Array[] = [];
const poolUint8Array: Uint8Array[] = [];
const poolUint8ClampedArray: Uint8ClampedArray[] = [];
const poolInt16Array: Int16Array[] = [];
const poolUint16Array: Uint16Array[] = [];
const poolInt32Array: Int32Array[] = [];
const poolUint32Array: Uint32Array[] = [];
const poolFloat32Array: Float32Array[] = [];
const poolFloat64Array: Float64Array[] = [];
const poolBigInt64Array: BigInt64Array[] = [];
const poolBigUint64Array: BigUint64Array[] = [];

export function getInt8Array(minLen: number, existing: Int8Array = null, maxLenMod = 2): Int8Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolInt8Array, existing);
    return arr ? arr : new Int8Array(minLen);
}
export function freeInt8Array(arr: Int8Array) { freeToPool(arr, poolInt8Array) }// FREE TYPED ARRAY

export function getUint8Array(minLen: number, existing: Uint8Array = null, maxLenMod = 2): Uint8Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolUint8Array, existing);
    return arr ? arr : new Uint8Array(minLen);
}
export function freeUint8Array(arr: Uint8Array) { freeToPool(arr, poolUint8Array) }// FREE TYPED ARRAY

export function getUint8ClampedArray(minLen: number, existing: Uint8ClampedArray = null, maxLenMod = 2): Uint8ClampedArray {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolUint8ClampedArray, existing);
    return arr ? arr : new Uint8ClampedArray(minLen);
}
export function freeUint8ClampedArray(arr: Uint8ClampedArray) { freeToPool(arr, poolUint8ClampedArray) }// FREE TYPED ARRAY

export function getInt16Array(minLen: number, existing: Int16Array = null, maxLenMod = 2): Int16Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolInt16Array, existing);
    return arr ? arr : new Int16Array(minLen);
}
export function freeInt16Array(arr: Int16Array) { freeToPool(arr, poolInt16Array) }// FREE TYPED ARRAY

export function getUint16Array(minLen: number, existing: Uint16Array = null, maxLenMod = 2): Uint16Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolUint16Array, existing);
    return arr ? arr : new Uint16Array(minLen);
}
export function freeUint16Array(arr: Uint16Array) { freeToPool(arr, poolUint16Array) }// FREE TYPED ARRAY

export function getInt32Array(minLen: number, existing: Int32Array = null, maxLenMod = 2): Int32Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolInt32Array, existing);
    return arr ? arr : new Int32Array(minLen);
}
export function freeInt32Array(arr: Int32Array) { freeToPool(arr, poolInt32Array) }// FREE TYPED ARRAY

export function getUint32Array(minLen: number, existing: Uint32Array = null, maxLenMod = 2): Uint32Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolUint32Array, existing);
    return arr ? arr : new Uint32Array(minLen);
}
export function freeUint32Array(arr: Uint32Array) { freeToPool(arr, poolUint32Array) }// FREE TYPED ARRAY

export function getFloat32Array(minLen: number, existing: Float32Array = null, maxLenMod = 2): Float32Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolFloat32Array, existing);
    return arr ? arr : new Float32Array(minLen);
}
export function freeFloat32Array(arr: Float32Array) { freeToPool(arr, poolFloat32Array) }// FREE TYPED ARRAY

export function getFloat64Array(minLen: number, existing: Float64Array = null, maxLenMod = 2): Float64Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolFloat64Array, existing);
    return arr ? arr : new Float64Array(minLen);
}
export function freeFloat64Array(arr: Float64Array) { freeToPool(arr, poolFloat64Array) }// FREE TYPED ARRAY

export function getBigInt64Array(minLen: number, existing: BigInt64Array = null, maxLenMod = 2): BigInt64Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolBigInt64Array, existing);
    return arr ? arr : new BigInt64Array(minLen);
}
export function freeBigInt64Array(arr: BigInt64Array) { freeToPool(arr, poolBigInt64Array) }// FREE TYPED ARRAY

export function getBigUint64Array(minLen: number, existing: BigUint64Array = null, maxLenMod = 2): BigUint64Array {// GET TYPED ARRAY
    const arr = getExistingArray(minLen, minLen * maxLenMod, poolBigUint64Array, existing);
    return arr ? arr : new BigUint64Array(minLen);
}
export function freeBigUint64Array(arr: BigUint64Array) { freeToPool(arr, poolBigUint64Array) }// FREE TYPED ARRAY




