import { test, expect } from '@playwright/test';

test.describe('Agents Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
  });

  test('should display agents page correctly', async ({ page }) => {
    // Check page title and description
    await expect(page.locator('h1:has-text("AI 투자 에이전트")')).toBeVisible();
    await expect(page.locator('text=다양한 성향의 AI 에이전트들이 투자 분석을 도와드립니다')).toBeVisible();
    
    // Check add agent button
    await expect(page.locator('button:has-text("에이전트 추가")')).toBeVisible();
  });

  test('should display agent cards with correct information', async ({ page }) => {
    // Wait for agents to load
    await page.waitForSelector('.grid', { timeout: 10000 });
    
    // Check if agent cards exist
    const agentCards = page.locator('a[href^="/agents/"]');
    const count = await agentCards.count();
    
    if (count > 0) {
      // Check first agent card has required elements
      const firstCard = agentCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check for agent name
      await expect(firstCard.locator('h3')).toBeVisible();
      
      // Check for patterns and watchlist counts
      await expect(firstCard.locator('text=/\\d+개 패턴/')).toBeVisible();
      await expect(firstCard.locator('text=/\\d+개 관심종목/')).toBeVisible();
    }
  });

  test('should open add agent modal', async ({ page }) => {
    // Click add agent button
    await page.click('button:has-text("에이전트 추가")');
    
    // Check modal is visible
    await expect(page.locator('h2:has-text("새 에이전트 생성")')).toBeVisible();
    
    // Check form fields
    await expect(page.locator('label:has-text("에이전트 이름")')).toBeVisible();
    await expect(page.locator('label:has-text("투자 성향")')).toBeVisible();
    await expect(page.locator('label:has-text("설명")')).toBeVisible();
    await expect(page.locator('label:has-text("투자 전략")')).toBeVisible();
    
    // Check cancel button works
    await page.click('button:has-text("취소")');
    await expect(page.locator('h2:has-text("새 에이전트 생성")')).not.toBeVisible();
  });

  test('should create a new agent', async ({ page }) => {
    // Open add agent modal
    await page.click('button:has-text("에이전트 추가")');
    
    // Fill in the form
    await page.fill('input[placeholder="예: Warren Bot"]', 'Test Agent');
    await page.selectOption('select', 'conservative');
    await page.fill('textarea', 'This is a test agent for automated testing');
    
    // Select some strategies
    await page.check('text=가치 투자');
    await page.check('text=장기 보유');
    
    // Submit the form
    await page.click('button:has-text("생성하기")');
    
    // Wait for modal to close
    await expect(page.locator('h2:has-text("새 에이전트 생성")')).not.toBeVisible({ timeout: 10000 });
    
    // Check if new agent appears in the list
    await expect(page.locator('text=Test Agent')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to agent detail page', async ({ page }) => {
    // Wait for agents to load
    await page.waitForSelector('a[href^="/agents/"]', { timeout: 10000 });
    
    // Get the first agent's href
    const firstAgentLink = page.locator('a[href^="/agents/"]').first();
    const href = await firstAgentLink.getAttribute('href');
    
    if (href) {
      // Click on the first agent
      await firstAgentLink.click();
      
      // Check navigation to detail page
      await expect(page).toHaveURL(href);
      
      // Check detail page elements
      await expect(page.locator('button:has-text("개요")')).toBeVisible();
      await expect(page.locator('button:has-text("패턴")')).toBeVisible();
      await expect(page.locator('button:has-text("관심종목")')).toBeVisible();
    }
  });

  test('should NOT have expandable agent cards', async ({ page }) => {
    // Wait for agents to load
    await page.waitForSelector('a[href^="/agents/"]', { timeout: 10000 });
    
    // Click on an agent card
    const firstCard = page.locator('a[href^="/agents/"]').first();
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    
    // Should navigate to detail page, not expand
    if (href) {
      await expect(page).toHaveURL(href);
    }
  });
});