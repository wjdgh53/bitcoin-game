import { test, expect } from '@playwright/test';

test.describe('Agent Detail Page Tests', () => {
  test('should display agent detail page correctly', async ({ page }) => {
    // First, get an agent ID from the agents page
    await page.goto('/agents');
    await page.waitForSelector('a[href^="/agents/"]', { timeout: 10000 });
    
    const firstAgentLink = page.locator('a[href^="/agents/"]').first();
    const href = await firstAgentLink.getAttribute('href');
    
    if (href) {
      // Navigate to detail page
      await page.goto(href);
      
      // Check header elements
      await expect(page.locator('h1')).toBeVisible(); // Agent name
      await expect(page.locator('text=/활성|비활성/')).toBeVisible(); // Status
      
      // Check navigation tabs
      await expect(page.locator('button:has-text("개요")')).toBeVisible();
      await expect(page.locator('button:has-text("패턴")')).toBeVisible();
      await expect(page.locator('button:has-text("관심종목")')).toBeVisible();
      
      // Check back navigation
      await expect(page.locator('a[href="/agents"]')).toBeVisible();
    }
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Navigate to an agent detail page
    await page.goto('/agents');
    await page.waitForSelector('a[href^="/agents/"]', { timeout: 10000 });
    const firstAgentLink = page.locator('a[href^="/agents/"]').first();
    await firstAgentLink.click();
    
    // Test Overview tab (default)
    await expect(page.locator('h3:has-text("에이전트 설명")')).toBeVisible();
    await expect(page.locator('h3:has-text("전략 개요")')).toBeVisible();
    
    // Switch to Patterns tab
    await page.click('button:has-text("패턴")');
    await expect(page.locator('h2:has-text("트레이딩 패턴")')).toBeVisible();
    await expect(page.locator('button:has-text("새 패턴 추가")')).toBeVisible();
    
    // Switch to Watchlist tab
    await page.click('button:has-text("관심종목")');
    await expect(page.locator('h2:has-text("관심종목")')).toBeVisible();
    await expect(page.locator('button:has-text("종목 추가")')).toBeVisible();
    
    // Switch back to Overview
    await page.click('button:has-text("개요")');
    await expect(page.locator('h3:has-text("에이전트 설명")')).toBeVisible();
  });

  test('should display agent statistics correctly', async ({ page }) => {
    // Navigate to an agent detail page
    await page.goto('/agents');
    await page.waitForSelector('a[href^="/agents/"]', { timeout: 10000 });
    const firstAgentLink = page.locator('a[href^="/agents/"]').first();
    await firstAgentLink.click();
    
    // Check statistics cards in overview
    await expect(page.locator('text=활성 패턴')).toBeVisible();
    await expect(page.locator('text=관심종목')).toBeVisible();
    await expect(page.locator('text=평균 신뢰도')).toBeVisible();
    
    // Check that statistics have numbers
    const statsNumbers = page.locator('.text-2xl.font-bold');
    const count = await statsNumbers.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should navigate back to agents list', async ({ page }) => {
    // Navigate to an agent detail page
    await page.goto('/agents');
    await page.waitForSelector('a[href^="/agents/"]', { timeout: 10000 });
    const firstAgentLink = page.locator('a[href^="/agents/"]').first();
    await firstAgentLink.click();
    
    // Click back button
    await page.click('a[href="/agents"]');
    
    // Should be back on agents list page
    await expect(page).toHaveURL('/agents');
    await expect(page.locator('h1:has-text("AI 투자 에이전트")')).toBeVisible();
  });

  test('should display patterns correctly', async ({ page }) => {
    // Navigate to an agent detail page
    await page.goto('/agents');
    await page.waitForSelector('a[href^="/agents/"]', { timeout: 10000 });
    const firstAgentLink = page.locator('a[href^="/agents/"]').first();
    await firstAgentLink.click();
    
    // Go to patterns tab
    await page.click('button:has-text("패턴")');
    
    // Check for pattern cards or empty state
    const patternCards = page.locator('.bg-white.rounded-lg.shadow');
    const emptyState = page.locator('text=패턴이 없습니다');
    
    const hasPatterns = await patternCards.count() > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasPatterns || isEmpty).toBeTruthy();
    
    if (hasPatterns) {
      // Check pattern card structure
      const firstPattern = patternCards.first();
      await expect(firstPattern.locator('h3')).toBeVisible(); // Pattern name
      await expect(firstPattern.locator('text=/신뢰도.*%/')).toBeVisible();
    }
  });

  test('should display watchlist correctly', async ({ page }) => {
    // Navigate to an agent detail page
    await page.goto('/agents');
    await page.waitForSelector('a[href^="/agents/"]', { timeout: 10000 });
    const firstAgentLink = page.locator('a[href^="/agents/"]').first();
    await firstAgentLink.click();
    
    // Go to watchlist tab
    await page.click('button:has-text("관심종목")');
    
    // Check for watchlist cards or empty state
    const watchlistCards = page.locator('.bg-white.rounded-lg.shadow');
    const emptyState = page.locator('text=관심종목이 없습니다');
    
    const hasItems = await watchlistCards.count() > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasItems || isEmpty).toBeTruthy();
    
    if (hasItems) {
      // Check watchlist card structure
      const firstItem = watchlistCards.first();
      await expect(firstItem.locator('h3')).toBeVisible(); // Symbol and name
      await expect(firstItem.locator('h4:has-text("관심 이유")')).toBeVisible();
      await expect(firstItem.locator('h4:has-text("에이전트 견해")')).toBeVisible();
    }
  });
});