import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should navigate between all main pages', async ({ page }) => {
    await page.goto('/');
    
    // Check homepage loads
    await expect(page).toHaveTitle(/Bitcoin Game/);
    
    // Navigate to Dashboard
    await page.click('text=대시보드');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1:has-text("Bitcoin Trading Dashboard")')).toBeVisible();
    
    // Navigate to Reports
    await page.click('text=리포트');
    await expect(page).toHaveURL('/reports');
    await expect(page.locator('h1:has-text("분석 리포트")')).toBeVisible();
    
    // Navigate to Agents
    await page.click('text=에이전트');
    await expect(page).toHaveURL('/agents');
    await expect(page.locator('h1:has-text("AI 투자 에이전트")')).toBeVisible();
    
    // Navigate to Chat
    await page.click('text=채팅');
    await expect(page).toHaveURL('/chat');
    
    // Navigate back to Home
    await page.click('text=홈');
    await expect(page).toHaveURL('/');
  });

  test('should have correct navigation items', async ({ page }) => {
    await page.goto('/');
    
    // Check all navigation items are present
    const navItems = ['홈', '대시보드', '리포트', '에이전트', '채팅'];
    
    for (const item of navItems) {
      await expect(page.locator(`nav >> text=${item}`)).toBeVisible();
    }
    
    // Verify watchlist is NOT present
    await expect(page.locator('nav >> text=관심종목')).not.toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');
    
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('nav')).toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
  });
});