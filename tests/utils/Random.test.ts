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



test('test 100 1 wiggle', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle(100, 1)
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(200);
    }
});

test('test 100 1 wiggle_up', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle_up(100, 1)
        expect(value).toBeGreaterThanOrEqual(100);
        expect(value).toBeLessThanOrEqual(200);
    }
});

test('test 100 1 wiggle_down', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle_down(100, 1)
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
    }
});


test('test 100 0.1 wiggle', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle(100, 0.1)
        expect(value).toBeGreaterThanOrEqual(90);
        expect(value).toBeLessThanOrEqual(110);
    }
});

test('test 100 0.1 wiggle_up', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle_up(100, 0.1)
        expect(value).toBeGreaterThanOrEqual(100);
        expect(value).toBeLessThanOrEqual(110);
    }
});

test('test 100 0.1 wiggle_down', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle_down(100, 0.1)
        expect(value).toBeGreaterThanOrEqual(90);
        expect(value).toBeLessThanOrEqual(100);
    }
});




test('test -100 2 wiggle', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle(-100, 2)
        expect(value).toBeGreaterThanOrEqual(-300);
        expect(value).toBeLessThanOrEqual(100);
    }
});

test('test -100 2 wiggle_up', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle_up(-100, 2)
        expect(value).toBeGreaterThanOrEqual(-100);
        expect(value).toBeLessThanOrEqual(100);
    }
});

test('test -100 2 wiggle_down', () => {
    for (let index = 0; index < 50; index++) {
        var value = Random.wiggle_down(-100, 2)
        expect(value).toBeGreaterThanOrEqual(-300);
        expect(value).toBeLessThanOrEqual(-100);
    }
});
