

// Based on : https://github.com/ecsyjs/ecsy/blob/master/src/ObjectPool.js
// Based on : https://github.com/getify/deePool/blob/master/lib/deePool.src.js
// https://stackoverflow.com/questions/24677592/generic-type-inference-with-class-argument/26696435#26696435
// https://stackoverflow.com/questions/17382143/create-a-new-object-from-type-parameter-in-generic-class


export class ObjectPool<T> {

    freeList: T[];
    count: number;
    isObjectPool: boolean;

    create: () => T
    reset: (item: T) => void

    // TODO pass  "create" and "reset" actions to constructor so this can be used with any Object
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

        return item;
    }

    public free(item: T): void {
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