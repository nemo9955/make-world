import * as Random from "../../src/utils/Random"

test('test positive random_float_clamp', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.random_float_clamp(5, 10)
        expect(value).toBeGreaterThan(5);
        expect(value).toBeLessThan(10);
    }
});
test('test mixed random_float_clamp', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.random_float_clamp(-10, 10)
        expect(value).toBeGreaterThan(-10);
        expect(value).toBeLessThan(10);
    }
});
test('test negative random_float_clamp', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.random_float_clamp(-50, -10)
        expect(value).toBeGreaterThan(-50);
        expect(value).toBeLessThan(-10);
    }
});
test('test invalid random_float_clamp', () => {
    for (let index = 0; index < 50; index++) {
        expect(() => {
            Random.random_float_clamp(50, -10);
        }).toThrow();
    }
});