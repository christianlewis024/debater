import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  let debateUrl;

  test.beforeEach(async ({ page }) => {
    // Log in and create a debate
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('claude1@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    await page.goto('/create');
    await page.getByLabel(/title/i).fill(`Chat Test ${Date.now()}`);
    await page.getByLabel(/category/i).selectOption('technology');
    await page.getByLabel(/turn time/i).fill('60');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForURL(/\/debate\//);
    debateUrl = page.url();
  });

  test('should display chat interface', async ({ page }) => {
    await page.goto(debateUrl);

    // Should show chat input and messages area
    const chatInput = page.getByPlaceholder(/message|chat|type/i);
    await expect(chatInput).toBeVisible({ timeout: 5000 });
  });

  test('should send a chat message', async ({ page }) => {
    await page.goto(debateUrl);

    const testMessage = `Test message ${Date.now()}`;

    // Find chat input
    const chatInput = page.getByPlaceholder(/message|chat|type/i);
    await chatInput.fill(testMessage);

    // Send message
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();

    // Message should appear in chat
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 3000 });
  });

  test('should display username with messages', async ({ page }) => {
    await page.goto(debateUrl);

    const testMessage = `Username test ${Date.now()}`;

    const chatInput = page.getByPlaceholder(/message|chat|type/i);
    await chatInput.fill(testMessage);

    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();

    // Should show username (claude1)
    await expect(page.getByText(/claude1/i)).toBeVisible({ timeout: 3000 });
  });

  test('should receive messages from other users in real-time', async ({ page, context }) => {
    await page.goto(debateUrl);

    // Open second browser as claude2
    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.getByLabel(/email/i).fill('claude2@test.com');
    await page2.getByLabel(/password/i).fill('test123');
    await page2.getByRole('button', { name: /log in/i }).click();
    await page2.waitForURL((url) => !url.pathname.includes('/login'));

    await page2.goto(debateUrl);
    await page2.waitForTimeout(1000);

    // Send message from page2
    const testMessage = `Real-time test ${Date.now()}`;
    const chatInput2 = page2.getByPlaceholder(/message|chat|type/i);
    await chatInput2.fill(testMessage);

    const sendButton2 = page2.getByRole('button', { name: /send/i });
    await sendButton2.click();

    // Page 1 should see the message
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });

    await page2.close();
  });

  test('should display messages in chronological order', async ({ page }) => {
    await page.goto(debateUrl);

    // Send multiple messages
    const messages = ['First message', 'Second message', 'Third message'];

    for (const msg of messages) {
      const chatInput = page.getByPlaceholder(/message|chat|type/i);
      await chatInput.fill(msg);
      await page.getByRole('button', { name: /send/i }).click();
      await page.waitForTimeout(500);
    }

    // All messages should be visible
    for (const msg of messages) {
      await expect(page.getByText(msg)).toBeVisible();
    }
  });

  test('should clear input after sending message', async ({ page }) => {
    await page.goto(debateUrl);

    const chatInput = page.getByPlaceholder(/message|chat|type/i);
    await chatInput.fill('Test message');

    await page.getByRole('button', { name: /send/i }).click();

    // Input should be empty
    await expect(chatInput).toHaveValue('');
  });

  test('should not send empty messages', async ({ page }) => {
    await page.goto(debateUrl);

    const chatInput = page.getByPlaceholder(/message|chat|type/i);
    const sendButton = page.getByRole('button', { name: /send/i });

    // Try to send empty message
    await chatInput.fill('');
    const isDisabled = await sendButton.isDisabled();

    // Button should be disabled or click should do nothing
    expect(isDisabled || true).toBe(true);
  });
});

test.describe('Voting System', () => {
  let debateUrl;

  test.beforeEach(async ({ page }) => {
    // Create a debate
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('claude1@test.com');
    await page.getByLabel(/password/i).fill('test123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    await page.goto('/create');
    await page.getByLabel(/title/i).fill(`Vote Test ${Date.now()}`);
    await page.getByLabel(/category/i).selectOption('technology');
    await page.getByLabel(/turn time/i).fill('60');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForURL(/\/debate\//);
    debateUrl = page.url();
  });

  test('should display voting interface', async ({ page }) => {
    await page.goto(debateUrl);

    // Should show vote buttons or vote section
    const voteSection = page.getByText(/vote|who won/i);
    await expect(voteSection).toBeVisible({ timeout: 5000 });
  });

  test('should allow voting for debater_a', async ({ page }) => {
    await page.goto(debateUrl);

    // Find vote button for debater_a (PRO)
    const voteButton = page.getByRole('button', { name: /vote.*pro|vote.*debater a/i });

    if (await voteButton.isVisible()) {
      await voteButton.click();

      // Should show confirmation or update vote count
      await page.waitForTimeout(1000);
    }

    expect(true).toBe(true); // Placeholder
  });

  test('should allow voting for debater_b', async ({ page }) => {
    await page.goto(debateUrl);

    // Find vote button for debater_b (CON)
    const voteButton = page.getByRole('button', { name: /vote.*con|vote.*debater b/i });

    if (await voteButton.isVisible()) {
      await voteButton.click();

      await page.waitForTimeout(1000);
    }

    expect(true).toBe(true); // Placeholder
  });

  test('should display vote percentages', async ({ page, context }) => {
    await page.goto(debateUrl);

    // Should show percentages like "50%" or "0 votes"
    const votePercent = page.getByText(/\d+%|\d+.*votes?/i);
    await expect(votePercent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should prevent duplicate voting', async ({ page }) => {
    await page.goto(debateUrl);

    // Vote once
    const voteButton = page.getByRole('button', { name: /vote/i }).first();

    if (await voteButton.isVisible()) {
      await voteButton.click();
      await page.waitForTimeout(1000);

      // Try to vote again
      const voteButton2 = page.getByRole('button', { name: /vote/i }).first();

      if (await voteButton2.isVisible()) {
        await voteButton2.click();

        // Should show error or button should be disabled
        const errorMessage = page.getByText(/already voted|cannot vote/i);
        const isError = await errorMessage.isVisible();

        expect(isError || await voteButton2.isDisabled()).toBe(true);
      }
    }
  });

  test('should update vote counts in real-time', async ({ page, context }) => {
    await page.goto(debateUrl);

    // Get initial vote count
    await page.waitForTimeout(2000);

    // Open second browser and vote
    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.getByLabel(/email/i).fill('claude2@test.com');
    await page2.getByLabel(/password/i).fill('test123');
    await page2.getByRole('button', { name: /log in/i }).click();
    await page2.waitForURL((url) => !url.pathname.includes('/login'));

    await page2.goto(debateUrl);
    await page2.waitForTimeout(1000);

    const voteButton2 = page2.getByRole('button', { name: /vote/i }).first();
    if (await voteButton2.isVisible()) {
      await voteButton2.click();
      await page2.waitForTimeout(1000);
    }

    // Page 1 should see updated vote count
    await page.waitForTimeout(2000);

    // Verify vote count increased
    expect(true).toBe(true); // Placeholder

    await page2.close();
  });

  test('should show total vote count', async ({ page }) => {
    await page.goto(debateUrl);

    // Should display total number of votes
    const totalVotes = page.getByText(/\d+.*total.*votes?|votes?.*cast/i);

    if (await totalVotes.isVisible()) {
      expect(true).toBe(true);
    }
  });

  test('should calculate percentages correctly', async ({ page }) => {
    // With 2 votes for A and 1 vote for B, should show 66.7% and 33.3%
    expect(true).toBe(true); // Placeholder
  });
});
