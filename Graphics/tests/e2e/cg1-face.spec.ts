/*
 * Student: Isabela V
 *
 * End-to-end tests for the CG_1 page: the page must show the name, draw the
 * scene without errors, and offer the five transformation orders in the GUI.
 */

import { test, expect } from '@playwright/test';

const PAGE = '/CG_1/index.html';
const ORDERS = [
    'scale -> rotation -> translation',
    'scale -> translation -> rotation',
    'translation -> scale -> rotation',
    'rotation -> translation -> scale',
    'rotation -> scale -> translation',
];
const DEFAULT_ORDER = 'scale -> translation -> rotation';

test.describe('CG_1 face page', () => {
    test('title and header include the student name', async ({ page }) => {
        await page.goto(PAGE);

        await expect(page).toHaveTitle(/Isabela V/);
        await expect(page.locator('h1')).toContainText('Isabela V');
    });

    test('draws the canvas without script errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto(PAGE);
        await expect(page.locator('canvas')).toBeVisible();

        // Give the render loop a few frames to run
        await page.waitForTimeout(200);
        expect(errors).toEqual([]);
    });

    test('the order dropdown lists the five orders and starts on the default', async ({ page }) => {
        await page.goto(PAGE);

        const select = page.locator('.lil-gui select').first();
        await expect(select).toBeVisible();

        const options = await select.locator('option').allTextContents();
        expect(options).toEqual(ORDERS);
        await expect(select).toHaveValue(DEFAULT_ORDER);
    });

    test('changing the order updates the dropdown value', async ({ page }) => {
        await page.goto(PAGE);

        const select = page.locator('.lil-gui select').first();
        await select.selectOption('rotation -> scale -> translation');
        await expect(select).toHaveValue('rotation -> scale -> translation');
    });
});
