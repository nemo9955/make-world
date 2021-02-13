

export type OverlapingData = {
    min: number
    max: number
    chance?: number
    pick: any
}

export function randPercent() {
    return Math.random() * 100
}

export function random_float_clamp(min: number, max: number) {
    if (min >= max) throw new Error("min must be less than max");
    return min + (Math.random() * (max - min))
}

export function random_int_clamp(min: number, max: number) {
    if (min >= max) throw new Error("min must be less than max");
    return Math.round(random_float_clamp(min, max))
}

export function wiggle(number: number, amplitude: number) {
    return number + ((random_float_clamp(0, amplitude * 2) - amplitude) * number)
}

export function wiggle_up(number: number, amplitude: number) {
    return number + (random_float_clamp(0, amplitude) * Math.abs(number))
}

export function wiggle_down(number: number, amplitude: number) {
    return number - (random_float_clamp(0, amplitude) * Math.abs(number))
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


export function customComparator(propToUse: string, reverse = false) {
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

