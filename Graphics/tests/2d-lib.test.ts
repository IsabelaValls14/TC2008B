/*
 * Student: Isabela V
 *
 * Unit tests for the 2D matrix helpers in libs/2d-lib.ts.
 * Each test applies a matrix to a point and checks where the point ends up.
 */

import assert from 'node:assert/strict';
import { V2, M3, type Mat3 } from '../libs/2d-lib.ts';

const TOLERANCE = 1e-9;

// Apply a column-major 3x3 matrix to a 2D point
function applyTo(m: Mat3, x: number, y: number): [number, number] {
    return [m[0] * x + m[3] * y + m[6], m[1] * x + m[4] * y + m[7]];
}

function assertPointNear(actual: [number, number], expected: [number, number]): void {
    assert.ok(Math.abs(actual[0] - expected[0]) < TOLERANCE, `x: ${actual[0]} != ${expected[0]}`);
    assert.ok(Math.abs(actual[1] - expected[1]) < TOLERANCE, `y: ${actual[1]} != ${expected[1]}`);
}

describe('V2', () => {
    it('adds two vectors component by component', () => {
        const sum = V2.add(V2.create(1, 2), V2.create(3, 4));
        assert.deepEqual([...sum], [4, 6]);
    });

    it('subtracts the second vector from the first', () => {
        const difference = V2.subtract(V2.create(5, 5), V2.create(2, 1));
        assert.deepEqual([...difference], [3, 4]);
    });

    it('multiplies every component by the scalar', () => {
        const scaled = V2.scale(V2.create(2, 3), 2);
        assert.deepEqual([...scaled], [4, 6]);
    });

    it('writes into the optional destination vector', () => {
        const destination = V2.create(0, 0);
        const result = V2.add(V2.create(1, 1), V2.create(1, 1), destination);
        assert.strictEqual(result, destination);
        assert.deepEqual([...destination], [2, 2]);
    });
});

describe('M3', () => {
    it('identity leaves a point unchanged', () => {
        assertPointNear(applyTo(M3.identity(), 7, -3), [7, -3]);
    });

    it('translation moves a point by the vector', () => {
        assertPointNear(applyTo(M3.translation(V2.create(10, -4)), 1, 2), [11, -2]);
    });

    it('rotation turns a point counter-clockwise around the origin', () => {
        assertPointNear(applyTo(M3.rotation(Math.PI / 2), 1, 0), [0, 1]);
    });

    it('scale stretches each axis independently', () => {
        assertPointNear(applyTo(M3.scale(V2.create(2, 3)), 1, 1), [2, 3]);
    });

    it('multiply applies the right-hand matrix first', () => {
        // Scale by 2, then translate by 10: (1, 0) -> (2, 0) -> (12, 0)
        const scaleThenTranslate = M3.multiply(
            M3.translation(V2.create(10, 0)), M3.scale(V2.create(2, 2)));
        assertPointNear(applyTo(scaleThenTranslate, 1, 0), [12, 0]);

        // Translate by 10, then scale by 2: (1, 0) -> (11, 0) -> (22, 0)
        const translateThenScale = M3.multiply(
            M3.scale(V2.create(2, 2)), M3.translation(V2.create(10, 0)));
        assertPointNear(applyTo(translateThenScale, 1, 0), [22, 0]);
    });

    it('multiply does not change its inputs', () => {
        const a = M3.translation(V2.create(1, 2));
        const b = M3.rotation(0.3);
        const aBefore = [...a];
        const bBefore = [...b];
        M3.multiply(a, b);
        assert.deepEqual(a, aBefore);
        assert.deepEqual(b, bBefore);
    });

    it('rotating around a pivot keeps the pivot in place', () => {
        // Same composition the face uses: move to origin, rotate, move back
        const pivot = V2.create(100, 100);
        const aroundPivot = M3.multiply(
            M3.translation(pivot),
            M3.multiply(M3.rotation(1.0), M3.translation(V2.create(-100, -100))));
        assertPointNear(applyTo(aroundPivot, 100, 100), [100, 100]);
    });

    it('rotating around a pivot keeps the distance to the pivot', () => {
        const aroundPivot = M3.multiply(
            M3.translation(V2.create(100, 100)),
            M3.multiply(M3.rotation(0.6), M3.translation(V2.create(-100, -100))));
        const [x, y] = applyTo(aroundPivot, 300, 100);
        const distance = Math.hypot(x - 100, y - 100);
        assert.ok(Math.abs(distance - 200) < TOLERANCE, `distance ${distance} != 200`);
    });
});
