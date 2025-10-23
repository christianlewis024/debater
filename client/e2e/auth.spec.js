import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login and signup links on homepage', async ({ page }) => {
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  });

  test('should log in with test account', async ({ page }) => {
    await page.goto('/login');

    // Fill in test credentials
    await page.getByLabel(/email/i).fill('claude1@test.com');
    await page.getByLabel(/password/i).fill('test123');

    // Click login button
    await page.getByRole('button', { name: /log in/i }).click();

    // Should redirect to home or profile
    await expect(page).not.toHaveURL(/\/login/);

    // Should see user menu or profile indicator
    await expect(page.getByText(/claude1/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    await page.getByRole('button', { name: /log in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error|wrong/i)).toBeVisible({ timeout: 5000 });
  });

  test('should log out successfully', async ({ page }) => {
    // First log in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('claude1@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /log in/i }).click();

    // Wait for login to complete
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Find and click logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Should see login/signup again
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
  });

  test('should protect debate routes when not logged in', async ({ page }) => {
    await page.goto('/create');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should allow access to protected routes when logged in', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('claude1@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /log in/i }).click();

    await page.waitForURL((url) => !url.pathname.includes('/login'));

    // Navigate to protected route
    await page.goto('/create');

    // Should show create debate form
    await expect(page).toHaveURL(/\/create/);
    await expect(page.getByText(/create|new debate/i)).toBeVisible();
  });
});
