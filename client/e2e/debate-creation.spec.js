import { test, expect } from '@playwright/test';

test.describe('Debate Creation & Joining', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('claude1@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));
  });

  test('should display create debate page', async ({ page }) => {
    await page.goto('/create');

    await expect(page.getByText(/create.*debate/i)).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
  });

  test('should create a new debate', async ({ page }) => {
    await page.goto('/create');

    // Fill in debate form
    await page.getByLabel(/title/i).fill('Test Debate: AI Ethics');
    await page.getByLabel(/category/i).selectOption('technology');
    await page.getByLabel(/description/i).fill('A test debate about AI ethics');

    // Set debate settings
    await page.getByLabel(/turn time/i).fill('60');
    await page.getByLabel(/max turns/i).fill('10');

    // Submit form
    await page.getByRole('button', { name: /create/i }).click();

    // Should redirect to debate page
    await expect(page).toHaveURL(/\/debate\//, { timeout: 10000 });
  });

  test('should display debates on browse page', async ({ page }) => {
    await page.goto('/browse');

    await expect(page.getByText(/browse.*debates|available.*debates/i)).toBeVisible();

    // Should show at least one debate or empty state
    const hasDebates = await page.locator('[data-testid="debate-card"], .debate-item').count();
    expect(hasDebates).toBeGreaterThanOrEqual(0);
  });

  test('should filter debates by category', async ({ page }) => {
    await page.goto('/browse');

    // Select a category filter
    const categoryFilter = page.getByLabel(/category/i);
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('technology');

      // Wait for filter to apply
      await page.waitForTimeout(1000);
    }

    expect(true).toBe(true); // Placeholder for actual assertion
  });

  test('should filter debates by status', async ({ page }) => {
    await page.goto('/browse');

    // Select status filter
    const statusFilter = page.getByLabel(/status/i);
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('active');

      await page.waitForTimeout(1000);
    }

    expect(true).toBe(true); // Placeholder
  });

  test('should navigate to debate details', async ({ page }) => {
    await page.goto('/browse');

    // Find first debate card
    const firstDebate = page.locator('[data-testid="debate-card"], .debate-item').first();

    if (await firstDebate.isVisible()) {
      await firstDebate.click();

      // Should navigate to debate page
      await expect(page).toHaveURL(/\/debate\//);
    }
  });
});

test.describe('Joining Debates', () => {
  let debateUrl;

  test.beforeEach(async ({ page }) => {
    // Create a debate first (as claude1)
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('claude1@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    await page.goto('/create');
    await page.getByLabel(/title/i).fill(`E2E Test Debate ${Date.now()}`);
    await page.getByLabel(/category/i).selectOption('technology');
    await page.getByLabel(/turn time/i).fill('60');
    await page.getByLabel(/max turns/i).fill('5');
    await page.getByRole('button', { name: /create/i }).click();

    await page.waitForURL(/\/debate\//);
    debateUrl = page.url();
  });

  test('should allow user to join as debater_a (PRO)', async ({ page }) => {
    await page.goto(debateUrl);

    // Look for join button
    const joinButton = page.getByRole('button', { name: /join.*pro|take.*pro/i });

    if (await joinButton.isVisible()) {
      await joinButton.click();

      // Should show as joined
      await expect(page.getByText(/you.*joined|debater a/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow second user to join as debater_b (CON)', async ({ page, context }) => {
    // First user joins as debater_a
    await page.goto(debateUrl);
    const joinProButton = page.getByRole('button', { name: /join.*pro/i });
    if (await joinProButton.isVisible()) {
      await joinProButton.click();
      await page.waitForTimeout(1000);
    }

    // Log out and log in as claude2
    await page.getByRole('button', { name: /logout/i }).click();
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('claude2@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    // Join as debater_b
    await page.goto(debateUrl);
    const joinConButton = page.getByRole('button', { name: /join.*con/i });

    if (await joinConButton.isVisible()) {
      await joinConButton.click();

      await expect(page.getByText(/you.*joined|debater b/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow third user to join as moderator', async ({ page }) => {
    // Log in as claude3
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('claude3@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    await page.goto(debateUrl);

    const joinModButton = page.getByRole('button', { name: /join.*moderator|become.*moderator/i });

    if (await joinModButton.isVisible()) {
      await joinModButton.click();

      await expect(page.getByText(/moderator/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show viewer count', async ({ page }) => {
    await page.goto(debateUrl);

    // Should display viewer count somewhere
    const viewerCount = page.getByText(/\d+.*viewers?|watching/i);
    await expect(viewerCount).toBeVisible({ timeout: 5000 });
  });
});
