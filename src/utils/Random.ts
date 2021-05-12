

export type OverlapingData = {
    min: number
    max: number
    chance?: number
    pick: any
}

export function randPercent() {
    return Math.random() * 100
}

export function randClampFloat(min: number, max: number) {
    if (min >= max) throw new Error("min must be less than max");
    return min + (Math.random() * (max - min))
}

export function randClampInt(min: number, max: number) {
    if (min >= max) throw new Error("min must be less than max");
    return Math.round(randClampFloat(min, max))
}

export function wiggleFloat(number: number, amplitude: number) {
    return number + ((randClampFloat(0, amplitude * 2) - amplitude) * number)
}

export function wiggleInt(number: number, amplitude: number) {
    return Math.round(number + ((randClampFloat(0, amplitude * 2) - amplitude) * number))
}

export function wiggle_up(number: number, amplitude: number) {
    return number + (randClampFloat(0, amplitude) * Math.abs(number))
}

export function wiggle_down(number: number, amplitude: number) {
    return number - (randClampFloat(0, amplitude) * Math.abs(number))
}




export function randIndexes(cntIndex: number, maxIndex: number) {
    var arr: number[] = [];

    for (let index = 0; index < cntIndex; index++)
        arr.push(randClampInt(0, maxIndex - 1))

    return arr;
}



export function pickAllOverlaping(spot: number, pickData: OverlapingData[]) {
    var validPicks: OverlapingData[] = []

    for (const pick_ of pickData) {
        if (pick_.min <= spot && spot <= pick_.max) {
            validPicks.push(pick_);
        }
    }

    return validPicks;
}


export function customComparator(propToUse: string | number, reverse = false) {
    // https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
    var less: -1 | 1 = -1;
    var great: -1 | 1 = 1;
    if (reverse) {
        less = 1;
        great = - 1;
    }

    return (a: any, b: any) => {
        if (a[propToUse] < b[propToUse])
            return less;
        if (a[propToUse] > b[propToUse])
            return great;
        return 0;
    }
}


export function pickChanceOverlaping(spot: number, pickData: OverlapingData[]) {
    var validPicks: OverlapingData[] = pickAllOverlaping(spot, pickData)

    validPicks = validPicks.sort(customComparator("chance", true));
    // console.log("validPicks", validPicks);

    var totalChance = 0;
    validPicks.forEach(element => { totalChance += element.chance; });
    const randomPick = Math.random() * totalChance;

    var movingChance = 0;
    for (const pick_ of validPicks) {
        movingChance += pick_.chance;
        if (randomPick < movingChance)
            return pick_;
    }
    return null;

}







var lowAlphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
var uppAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
var allAlphabet = [...lowAlphabet, ...uppAlphabet]

export function randomAlphabetString(size_: number = 6): string {
    return randomPartOfArray(allAlphabet, size_).join("")
}

export function randomPartOfArray(array: any[], size_: number) {
    var l = array.length, r, b;

    while (l) {
        r = Math.floor(Math.random() * --l);
        b = array[r];
        array[r] = array[l];
        array[l] = b;
    }

    // const size_ = Math.floor(Math.random() * array.length);
    return array.slice(0, size_).sort();

}

import { max } from "d3-array";
import noise_lib = require("noisejs")
export function makeNoise(seed: number): Noise {
    return new (noise_lib as any).Noise(seed)
}



