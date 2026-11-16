/*
 * Utility functions for transformation matrices in 2D.
 * Converted from JavaScript to TypeScript with the help of Claude.
 *
 * Gilberto Echeverria
 * 2026-07-13
 */

// Constants to simplify references to the X, Y and Z axis
const X = 0;
const Y = 1;

// A 2D vector, backed by a Float32Array of length 2.
//type Vec2 = number[];
export type Vec2 = Float32Array;

// A 3x3 matrix used for 2D transformations, represented as a flat
// column-major array of 9 numbers (see layout note at bottom of file).
export type Mat3 = number[];

// 2D vector
export class V2 {
    static create(x: number, y: number): Vec2 {
        const v = new Float32Array(2);
        v[0] = x;
        v[1] = y;
        return v;
    }

    static add(u: Vec2, v: Vec2, dest?: Vec2): Vec2 {
        dest = dest || new Float32Array(2);
        dest[X] = u[X] + v[X];
        dest[Y] = u[Y] + v[Y];
        return dest;
    }

    static subtract(u: Vec2, v: Vec2, dest?: Vec2): Vec2 {
        dest = dest || new Float32Array(2);
        dest[X] = u[X] - v[X];
        dest[Y] = u[Y] - v[Y];
        return dest;
    }

    static scale(v: Vec2, k: number, dest?: Vec2): Vec2 {
        dest = dest || new Float32Array(2);
        dest[X] = v[X] * k;
        dest[Y] = v[Y] * k;
        return dest;
    }
}

// 3x3 matrices used for 2D transformations
export class M3 {
    static identity(): Mat3 {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ];
    }

    // Translation by the vector v. The translation lives in the last column,
    // which is elements 6 and 7 of the column-major array.
    static translation(v: Vec2): Mat3 {
        return [
            1,       0,       0,
            0,       1,       0,
            v[X],    v[Y],    1,
        ];
    }

    // Counter-clockwise rotation around the origin, in radians.
    static rotation(angleRadians: number): Mat3 {
        const c = Math.cos(angleRadians);
        const s = Math.sin(angleRadians);
        return [
             c,  s,  0,
            -s,  c,  0,
             0,  0,  1,
        ];
    }

    // Scale along the X and Y axes, relative to the origin.
    static scale(v: Vec2): Mat3 {
        return [
            v[X],  0,     0,
            0,     v[Y],  0,
            0,     0,     1,
        ];
    }

    // Matrix product a * b. Both matrices are column-major, so element
    // (row, col) is stored at index col * 3 + row. Applying the result to a
    // point is the same as applying b first and then a.
    static multiply(a: Mat3, b: Mat3): Mat3 {
        const result: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                for (let k = 0; k < 3; k++) {
                    result[col * 3 + row] += a[k * 3 + row] * b[col * 3 + k];
                }
            }
        }
        return result;
    }

}
