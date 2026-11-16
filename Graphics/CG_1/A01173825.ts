/*
 * Student: Isabela V
 *
 * Draws a 2D face made of triangles, and a diamond that acts as the pivot.
 * The face is transformed with 2D matrices (scale, rotation and translation).
 * The rotation is done around the pivot. The order in which the three
 * transformations are applied can be changed from a dropdown in the lil-gui panel.
 */

'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { diamond } from '../libs/shapes.js';
import { V2, M3, type Vec2, type Mat3 } from '../libs/2d-lib.js';
import { Scene } from '../libs/scene.js';
import { type Color } from '../libs/color.js';
import { type Object3D } from '../libs/object3d.js';

// Import the shaders from external files
import vsGLSL from './vs_transforms_vcolor.glsl?raw';
import fsGLSL from './fs_vertex_color.glsl?raw';

// Transformations that can be applied to the face
type Operation = 'scale' | 'rotation' | 'translation';

// Orders offered in the dropdown. The first operation is applied to the
// points first, and the last one is applied last.
const ORDERS: Record<string, Operation[]> = {
    'scale -> rotation -> translation': ['scale', 'rotation', 'translation'],
    'scale -> translation -> rotation': ['scale', 'translation', 'rotation'],
    'translation -> scale -> rotation': ['translation', 'scale', 'rotation'],
    'rotation -> translation -> scale': ['rotation', 'translation', 'scale'],
    'rotation -> scale -> translation': ['rotation', 'scale', 'translation'],
};
const ORDER_LABELS = Object.keys(ORDERS);

const FACE_RADIUS = 150;
const PIVOT_SIZE = 30;
const HEAD_SEGMENTS = 64;
const MOUTH_SEGMENTS = 12;

// Colors used for the parts of the face
const SKIN_COLOR: Color = [1.0, 0.9, 0.2, 1];
const FEATURE_COLOR: Color = [0, 0, 0, 1];
const PIVOT_COLOR: Color = [0.6, 0.6, 0.6, 1];

type Point = [number, number];

// Data for a mesh, in the layout that twgl expects
interface MeshData {
    positions: number[];
    colors: number[];
    indices: number[];
}

// Add one triangle with a single color to the mesh
function addTriangle(mesh: MeshData, a: Point, b: Point, c: Point, color: Color): void {
    const first = mesh.positions.length / 2;
    for (const [x, y] of [a, b, c]) {
        mesh.positions.push(x, y);
        mesh.colors.push(...color);
    }
    mesh.indices.push(first, first + 1, first + 2);
}

// Point on a circle, given its center, radius and angle in radians
function polar(center: Point, radius: number, angle: number): Point {
    return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
}

// Head: a fan of triangles around the center of the face
function addHead(mesh: MeshData, radius: number): void {
    const center: Point = [0, 0];
    for (let i = 0; i < HEAD_SEGMENTS; i++) {
        const angleA = (i / HEAD_SEGMENTS) * Math.PI * 2;
        const angleB = ((i + 1) / HEAD_SEGMENTS) * Math.PI * 2;
        addTriangle(mesh, center, polar(center, radius, angleA),
            polar(center, radius, angleB), SKIN_COLOR);
    }
}

// Eyes: two triangles pointing down
function addEyes(mesh: MeshData, radius: number): void {
    const size = radius * 0.12;
    for (const side of [-1, 1]) {
        const x = side * radius * 0.35;
        const y = radius * 0.3;
        addTriangle(mesh, [x - size, y + size], [x + size, y + size], [x, y - size],
            FEATURE_COLOR);
    }
}

// Mouth: a curved band made of quads, each split into two triangles
function addMouth(mesh: MeshData, radius: number): void {
    const center: Point = [0, radius * 0.05];
    const outerRadius = radius * 0.6;
    const innerRadius = radius * 0.5;
    const startAngle = Math.PI * 1.17;
    const endAngle = Math.PI * 1.83;
    for (let i = 0; i < MOUTH_SEGMENTS; i++) {
        const t0 = startAngle + (i / MOUTH_SEGMENTS) * (endAngle - startAngle);
        const t1 = startAngle + ((i + 1) / MOUTH_SEGMENTS) * (endAngle - startAngle);
        const outer0 = polar(center, outerRadius, t0);
        const outer1 = polar(center, outerRadius, t1);
        const inner0 = polar(center, innerRadius, t0);
        const inner1 = polar(center, innerRadius, t1);
        addTriangle(mesh, outer0, outer1, inner1, FEATURE_COLOR);
        addTriangle(mesh, outer0, inner1, inner0, FEATURE_COLOR);
    }
}

// Create the face centered at the origin, so its scale and rotation start there
function createFace(radius: number): twgl.Arrays {
    const mesh: MeshData = { positions: [], colors: [], indices: [] };
    addHead(mesh, radius);
    addEyes(mesh, radius);
    addMouth(mesh, radius);

    return {
        a_position: { numComponents: 2, data: mesh.positions },
        a_color: { numComponents: 4, data: mesh.colors },
        indices: { numComponents: 3, data: mesh.indices },
    };
}

/*
 * Subclass of Scene with the face and the pivot.
 * Specifies the objects that will be used, and the UI operations available.
 */
class FaceScene extends Scene {
    // Values controlled from the dropdown. lil-gui writes into this object.
    // Starts with the order that moves the face to its position before it is
    // rotated around the pivot, so the face orbits the pivot
    private readonly settings = { order: 'scale -> translation -> rotation' };

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vsGLSL, fsGLSL);

        // The colors come from the a_color attribute of each vertex, so the
        // color given to addObject is not used by the shader
        const face = this.addObject('face', createFace(FACE_RADIUS), [1, 1, 1, 1]);
        face.transforms.t.x = gl.canvas.width * 0.65;
        face.transforms.t.y = gl.canvas.height / 2;

        const pivot = this.addObject('pivot', diamond(PIVOT_SIZE), PIVOT_COLOR);
        pivot.transforms.t.x = gl.canvas.width * 0.35;
        pivot.transforms.t.y = gl.canvas.height / 2;
    }

    // Method to draw the scene.
    protected render(): void {
        const { gl } = this;
        const face = this.getObject('face');
        const pivot = this.getObject('pivot');

        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.programInfo.program);

        this.drawObject(face, this.faceTransforms(face, pivot));

        const pivotTransforms = M3.translation(V2.create(pivot.transforms.t.x, pivot.transforms.t.y));
        this.drawObject(pivot, pivotTransforms);
    }

    // Draw one object with its transformation matrix
    private drawObject(object: Object3D, transforms: Mat3): void {
        const { gl, programInfo } = this;

        twgl.setUniforms(programInfo, {
            u_resolution: [gl.canvas.width, gl.canvas.height],
            u_transforms: transforms,
        });
        gl.bindVertexArray(object.vao);
        twgl.drawBufferInfo(gl, object.bufferInfo);
    }

    // Matrix for the face. The three basic transformations are multiplied in
    // the order chosen in the dropdown.
    private faceTransforms(face: Object3D, pivot: Object3D): Mat3 {
        const matrices: Record<Operation, Mat3> = {
            scale: M3.scale(V2.create(face.transforms.s.x, face.transforms.s.y)),
            rotation: this.rotationAroundPivot(face.transforms.rr.z, pivot),
            translation: M3.translation(V2.create(face.transforms.t.x, face.transforms.t.y)),
        };

        // Each new matrix goes on the left, so the first operation in the list
        // ends up being applied to the points first
        const operations = ORDERS[this.settings.order];
        return operations.reduce<Mat3>(
            (accumulated, operation) => M3.multiply(matrices[operation], accumulated),
            M3.identity());
    }

    // Rotation around the position of the pivot: move the pivot to the origin,
    // rotate, and move back
    private rotationAroundPivot(angleRadians: number, pivot: Object3D): Mat3 {
        const pivotPosition: Vec2 = V2.create(pivot.transforms.t.x, pivot.transforms.t.y);
        const toOrigin = M3.translation(V2.create(-pivotPosition[0], -pivotPosition[1]));
        const rotate = M3.rotation(angleRadians);
        const toPivot = M3.translation(pivotPosition);

        return M3.multiply(toPivot, M3.multiply(rotate, toOrigin));
    }

    setupUI(): void {
        const { gl } = this;
        const face = this.getObject('face');
        const pivot = this.getObject('pivot');

        const gui = new GUI();
        gui.add(this.settings, 'order', ORDER_LABELS).name('Order');

        const faceFolder = gui.addFolder('Face');

        const traFolder = faceFolder.addFolder('Translation');
        traFolder.add(face.transforms.t, 'x', 0, gl.canvas.width);
        traFolder.add(face.transforms.t, 'y', 0, gl.canvas.height);

        const rotFolder = faceFolder.addFolder('Rotation');
        rotFolder.add(face.transforms.rr, 'z', 0, Math.PI * 2);

        const scaFolder = faceFolder.addFolder('Scale');
        scaFolder.add(face.transforms.s, 'x', -5, 5);
        scaFolder.add(face.transforms.s, 'y', -5, 5);

        const pivotFolder = gui.addFolder('Pivot');
        const pivotTraFolder = pivotFolder.addFolder('Translation');
        pivotTraFolder.add(pivot.transforms.t, 'x', 0, gl.canvas.width);
        pivotTraFolder.add(pivot.transforms.t, 'y', 0, gl.canvas.height);
    }
}

/*
 * Main function to initialize the WebGL context, create the scene, and set up the UI.
 */
function main(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const scene = new FaceScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main();
