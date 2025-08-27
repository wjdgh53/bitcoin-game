import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Navigation Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display main navigation correctly', async ({ page }) => {
    await helpers.navigateToHome();

    // Check if navbar is visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Check if logo is present
    await expect(page.getByText('Bitcoin Game')).toBeVisible();
    await expect(page.locator('span:has-text("₿")')).toBeVisible();

    // Check all navigation links
    const navItems = [
      { text: '홈', href: '/' },
      { text: '대시보드', href: '/dashboard' },
      { text: '리포트', href: '/reports' },
      { text: '에이전트', href: '/agents' },
      { text: '채팅', href: '/chat' }
    ];

    for (const item of navItems) {
      const link = page.locator(`a[href="${item.href}"]`);
      await expect(link).toBeVisible();
      await expect(link.getByText(item.text)).toBeVisible();
    }
  });

  test('should navigate to different pages correctly', async ({ page }) => {
    // Start from home page
    await helpers.navigateToHome();
    await helpers.assertUrl('http://localhost:3000/');

    // Navigate to agents page
    await page.click('a[href="/agents"]');
    await helpers.assertUrl('http://localhost:3000/agents');
    await helpers.assertHeading('AI 투자 에이전트');

    // Navigate to dashboard
    await page.click('a[href="/dashboard"]');
    await helpers.assertUrl('http://localhost:3000/dashboard');

    // Navigate to reports
    await page.click('a[href="/reports"]');
    await helpers.assertUrl('http://localhost:3000/reports');

    // Navigate to chat
    await page.click('a[href="/chat"]');
    await helpers.assertUrl('http://localhost:3000/chat');

    // Navigate back to home
    await page.click('a[href="/"]');
    await helpers.assertUrl('http://localhost:3000/');
  });

  test('should highlight active navigation item', async ({ page }) => {
    await helpers.navigateToAgents();
    
    // Check if agents nav item is active
    const agentsLink = page.locator('a[href="/agents"]');
    await expect(agentsLink).toHaveClass(/bg-purple-100/);
    await expect(agentsLink).toHaveClass(/text-purple-700/);

    // Navigate to dashboard and check active state
    await page.click('a[href="/dashboard"]');
    const dashboardLink = page.locator('a[href="/dashboard"]');
    await expect(dashboardLink).toHaveClass(/bg-purple-100/);
    await expect(dashboardLink).toHaveClass(/text-purple-700/);
  });

  test('should handle navigation with keyboard', async ({ page }) => {
    await helpers.navigateToHome();

    // Use Tab to navigate through links
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    
    // Continue tabbing until we find a navigation link
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      if (focusedElement?.includes('홈') || focusedElement?.includes('대시보드')) {
        break;
      }
    }

    // Press Enter on focused navigation link
    await page.keyboard.press('Enter');
    
    // Should navigate to the selected page
    expect(page.url()).toMatch(/localhost:3000\/(dashboard|agents|reports|chat)?/);
  });

  test('should work on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helpers.navigateToHome();

    // Check if logo is still visible on mobile
    await expect(page.getByText('Bitcoin Game')).toBeVisible();
    
    // Navigation should still be functional (though layout may be different)
    await page.click('a[href="/agents"]');
    await helpers.assertUrl('http://localhost:3000/agents');
  });

  test('should handle page refresh correctly', async ({ page }) => {
    await helpers.navigateToAgents();
    
    // Refresh page
    await page.reload();
    
    // Should still be on agents page
    await helpers.assertUrl('http://localhost:3000/agents');
    await helpers.assertHeading('AI 투자 에이전트');
    
    // Navigation should still work after refresh
    await page.click('a[href="/dashboard"]');
    await helpers.assertUrl('http://localhost:3000/dashboard');
  });
});