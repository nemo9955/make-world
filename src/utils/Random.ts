


export function random_float_clamp(min: number, max: number) {
    if (min >= max) throw new Error("min must be less than max");
    return min + (Math.random() * (max - min))
}

export function wiggle(number: number, amplitude: number) {
    return number + ((random_float_clamp(0,amplitude*2)-amplitude) * number)
}

export function wiggle_up(number: number, amplitude: number) {
    return number + (random_float_clamp(0,amplitude) * Math.abs(number))
}

export function wiggle_down(number: number, amplitude: number) {
    return number - (random_float_clamp(0,amplitude) * Math.abs(number))
}
