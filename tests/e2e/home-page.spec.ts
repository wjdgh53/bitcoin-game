import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Home Page Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should load home page correctly', async ({ page }) => {
    await helpers.navigateToHome();
    
    // Check if page loads without errors
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Check if navbar is present
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Bitcoin Game')).toBeVisible();
  });

  test('should display page content properly', async ({ page }) => {
    await helpers.navigateToHome();
    
    // Wait for any loading states to complete
    await helpers.waitForLoadingToComplete();
    
    // Check if main content area exists
    await expect(page.locator('main, .container, [role="main"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle loading states gracefully', async ({ page }) => {
    await helpers.navigateToHome();
    
    // The page should eventually show content (not stuck in loading)
    await page.waitForLoadState('networkidle');
    
    // Should not show loading spinner indefinitely
    const spinners = page.locator('.animate-spin');
    if (await spinners.count() > 0) {
      // If there are spinners, they should disappear within reasonable time
      await expect(spinners.first()).not.toBeVisible({ timeout: 15000 });
    }
  });

  test('should be responsive', async ({ page }) => {
    await helpers.navigateToHome();

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('nav')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have proper meta information', async ({ page }) => {
    await helpers.navigateToHome();
    
    // Check if title is set
    await expect(page).toHaveTitle(/Bitcoin Game/);
    
    // Check viewport meta tag for mobile responsiveness
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');
  });

  test('should handle navigation from home page', async ({ page }) => {
    await helpers.navigateToHome();
    
    // Should be able to navigate to all main sections
    const navigationTests = [
      { link: '/agents', expectedContent: 'AI 투자 에이전트' },
      { link: '/dashboard', expectedContent: '' }, // Dashboard might not have specific text
      { link: '/reports', expectedContent: '' },
      { link: '/chat', expectedContent: 'AI 에이전트 채팅' }
    ];

    for (const test of navigationTests) {
      await helpers.navigateToHome();
      await page.click(`a[href="${test.link}"]`);
      await helpers.assertUrl(`http://localhost:3000${test.link}`);
      
      if (test.expectedContent) {
        await helpers.waitForText(test.expectedContent);
      }
    }
  });
});