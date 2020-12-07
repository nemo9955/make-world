


export function random_float_clamp(min: number, max: number) {
    if (min >= max) throw new Error("min must be less than max");
    return min + (Math.random() * (max - min))
}
