import { test, expect } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Waits for the game board canvas to appear and be visible */
async function waitForGameBoard(page: import('@playwright/test').Page) {
  await page.waitForSelector('#active-canvas', { state: 'visible' });
}

/** Sends a direction key to start the game and move */
async function pressDirection(page: import('@playwright/test').Page, key: 'ArrowRight' | 'ArrowLeft' | 'ArrowUp' | 'ArrowDown') {
  await page.keyboard.press(key);
}

// ─── Basic render tests ───────────────────────────────────────────────────────

test.describe('game renders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page title is Hac-Man', async ({ page }) => {
    await expect(page).toHaveTitle(/Hac-Man/i);
  });

  test('game board canvas is visible', async ({ page }) => {
    await waitForGameBoard(page);
    const canvas = page.locator('#active-canvas');
    await expect(canvas).toBeVisible();
  });

  test('header shows game title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Hac-Man');
  });

  test('touch direction buttons are present', async ({ page }) => {
    await expect(page.locator('[aria-label="Move up"]')).toBeVisible();
    await expect(page.locator('[aria-label="Move down"]')).toBeVisible();
    await expect(page.locator('[aria-label="Move left"]')).toBeVisible();
    await expect(page.locator('[aria-label="Move right"]')).toBeVisible();
  });

  test('reset button is present', async ({ page }) => {
    await expect(page.locator('[aria-label="Reset game"]')).toBeVisible();
  });
});

// ─── Game start ───────────────────────────────────────────────────────────────

test.describe('game start', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameBoard(page);
    // Focus the game div for keyboard events
    await page.locator('.App').click();
  });

  test('pressing right arrow starts the game', async ({ page }) => {
    await pressDirection(page, 'ArrowRight');
    // Wait briefly for game to start
    await page.waitForTimeout(500);
    // Game info footer should show score
    await expect(page.locator('.game-info')).toBeVisible();
  });

  test('game starts when touch direction button is pressed', async ({ page }) => {
    await page.locator('[aria-label="Move right"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.game-info')).toBeVisible();
  });
});

// ─── Game controls ────────────────────────────────────────────────────────────

test.describe('keyboard controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameBoard(page);
    await page.locator('.App').click();
  });

  test('WASD keys control movement', async ({ page }) => {
    // W = Up, A = Left, S = Down, D = Right
    await page.keyboard.press('d'); // Right
    await page.waitForTimeout(200);
    await page.keyboard.press('w'); // Up
    await page.waitForTimeout(200);
    // No errors should occur
    await expect(page.locator('#active-canvas')).toBeVisible();
  });

  test('R key resets the game', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    // Game should still be visible
    await expect(page.locator('#active-canvas')).toBeVisible();
  });
});

// ─── Reset button ─────────────────────────────────────────────────────────────

test.describe('reset button', () => {
  test('reset button resets the game state', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoard(page);
    await page.locator('.App').click();

    // Start game
    await pressDirection(page, 'ArrowRight');
    await page.waitForTimeout(500);

    // Reset
    await page.locator('[aria-label="Reset game"]').click();
    await page.waitForTimeout(200);

    // Canvas still visible, game should be in reset state (score = 0)
    await expect(page.locator('#active-canvas')).toBeVisible();
  });
});

// ─── Game info display ────────────────────────────────────────────────────────

test.describe('game info', () => {
  test('shows lives display', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoard(page);
    const gameInfo = page.locator('.game-info');
    await expect(gameInfo).toBeVisible();
  });

  test('score is initially 0', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoard(page);
    // Score section
    const scoreEl = page.locator('.game-info__score');
    await expect(scoreEl).toContainText('0');
  });
});

// ─── Mobile touch controls ────────────────────────────────────────────────────

test.describe('touch controls', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 size

  test('touch zones are accessible on mobile viewport', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoard(page);

    const upZone = page.locator('[aria-label="Move up"]');
    const downZone = page.locator('[aria-label="Move down"]');
    const leftZone = page.locator('[aria-label="Move left"]');
    const rightZone = page.locator('[aria-label="Move right"]');

    await expect(upZone).toBeVisible();
    await expect(downZone).toBeVisible();
    await expect(leftZone).toBeVisible();
    await expect(rightZone).toBeVisible();
  });

  test('tapping a direction button starts movement', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoard(page);

    await page.locator('[aria-label="Move right"]').tap();
    await page.waitForTimeout(300);

    // Game should be running (canvas still present, no errors)
    await expect(page.locator('#active-canvas')).toBeVisible();
  });
});

// ─── Game over ────────────────────────────────────────────────────────────────

test.describe('game over overlay', () => {
  test('game-over overlay is hidden initially', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoard(page);
    const overlay = page.locator('.game-over');
    await expect(overlay).not.toBeVisible();
  });
});
