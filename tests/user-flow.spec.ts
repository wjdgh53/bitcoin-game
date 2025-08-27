import { test, expect } from '@playwright/test';

test.describe('User Flow Tests', () => {
  test('complete user flow: create agent -> view detail -> navigate to chat', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Navigate to agents page
    await page.click('text=에이전트');
    await expect(page).toHaveURL('/agents');
    
    // Create a new agent
    await page.click('button:has-text("에이전트 추가")');
    
    // Fill in agent details
    const timestamp = Date.now();
    const agentName = `Flow Test Agent ${timestamp}`;
    
    await page.fill('input[placeholder="예: Warren Bot"]', agentName);
    await page.selectOption('select', 'quantitative');
    await page.fill('textarea', 'Agent created for user flow testing');
    
    // Select strategies
    await page.check('text=기술적 분석');
    await page.check('text=데이 트레이딩');
    await page.check('text=리스크 관리');
    
    // Create the agent
    await page.click('button:has-text("생성하기")');
    
    // Wait for modal to close and agent to appear
    await expect(page.locator('h2:has-text("새 에이전트 생성")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${agentName}`)).toBeVisible({ timeout: 10000 });
    
    // Click on the created agent to view detail
    await page.click(`text=${agentName}`);
    
    // Verify we're on the detail page
    await expect(page.locator(`h1:has-text("${agentName}")`)).toBeVisible();
    
    // Check all tabs work
    await page.click('button:has-text("패턴")');
    await expect(page.locator('h2:has-text("트레이딩 패턴")')).toBeVisible();
    
    await page.click('button:has-text("관심종목")');
    await expect(page.locator('h2:has-text("관심종목")')).toBeVisible();
    
    await page.click('button:has-text("개요")');
    await expect(page.locator('h3:has-text("에이전트 설명")')).toBeVisible();
    
    // Navigate to chat
    await page.click('nav >> text=채팅');
    await expect(page).toHaveURL('/chat');
    
    // Check if the created agent appears in chat (if applicable)
    // This depends on your chat implementation
    
    // Go back to agents and verify our agent is still there
    await page.click('text=에이전트');
    await expect(page.locator(`text=${agentName}`)).toBeVisible();
  });

  test('user flow: navigate through all main sections', async ({ page }) => {
    await page.goto('/');
    
    // Check home page
    await expect(page.locator('h1:has-text("Bitcoin Investment Game")')).toBeVisible();
    
    // Go to dashboard
    await page.click('text=대시보드');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1:has-text("Bitcoin Trading Dashboard")')).toBeVisible();
    
    // Check dashboard components
    await expect(page.locator('text=현재 잔액')).toBeVisible();
    await expect(page.locator('text=Bitcoin 보유량')).toBeVisible();
    
    // Go to reports
    await page.click('text=리포트');
    await expect(page).toHaveURL('/reports');
    await expect(page.locator('h1:has-text("분석 리포트")')).toBeVisible();
    
    // Check report filters
    await expect(page.locator('select')).toBeVisible(); // Agent selector
    
    // Go to agents
    await page.click('text=에이전트');
    await expect(page).toHaveURL('/agents');
    
    // If there are agents, click on one
    const agentCards = page.locator('a[href^="/agents/"]');
    const agentCount = await agentCards.count();
    
    if (agentCount > 0) {
      await agentCards.first().click();
      // Verify detail page loaded
      await expect(page.locator('button:has-text("개요")')).toBeVisible();
      
      // Go back to agents list
      await page.click('a[href="/agents"]');
    }
    
    // Go to chat
    await page.click('text=채팅');
    await expect(page).toHaveURL('/chat');
    
    // Return home
    await page.click('text=홈');
    await expect(page).toHaveURL('/');
  });

  test('user flow: search and filter agents', async ({ page }) => {
    await page.goto('/agents');
    
    // Wait for agents to load
    await page.waitForSelector('.grid, text=에이전트가 없습니다', { timeout: 10000 });
    
    const agentCards = page.locator('a[href^="/agents/"]');
    const initialCount = await agentCards.count();
    
    if (initialCount > 0) {
      // Test filtering by personality type
      // Note: This assumes you have filtering functionality
      // If not implemented, this test section can be skipped
      
      // Look for agents with specific personality
      const conservativeAgents = page.locator('text=보수적');
      const conservativeCount = await conservativeAgents.count();
      
      if (conservativeCount > 0) {
        // Click on a conservative agent
        const conservativeCard = page.locator('a[href^="/agents/"]:has-text("보수적")').first();
        await conservativeCard.click();
        
        // Verify detail page shows conservative personality
        await expect(page.locator('text=/conservative|보수적/')).toBeVisible();
      }
    }
  });

  test('responsive design flow', async ({ page }) => {
    // Test on desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    // Navigate through pages on desktop
    await page.click('text=에이전트');
    await expect(page.locator('h1:has-text("AI 투자 에이전트")')).toBeVisible();
    
    // Check grid layout on desktop
    const grid = page.locator('.grid');
    await expect(grid).toHaveCSS('display', 'grid');
    
    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('h1:has-text("AI 투자 에이전트")')).toBeVisible();
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('h1:has-text("AI 투자 에이전트")')).toBeVisible();
    
    // Check that cards stack vertically on mobile
    const cards = page.locator('a[href^="/agents/"]');
    const cardCount = await cards.count();
    
    if (cardCount > 1) {
      const firstCard = await cards.first().boundingBox();
      const secondCard = await cards.nth(1).boundingBox();
      
      if (firstCard && secondCard) {
        // Cards should be stacked vertically on mobile
        expect(secondCard.y).toBeGreaterThan(firstCard.y);
      }
    }
  });

  test('error handling flow', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    // Should show 404 or redirect to home
    
    // Test invalid agent ID
    await page.goto('/agents/invalid-agent-id');
    // Should show error message or redirect
    await expect(page.locator('text=/에이전트를 찾을 수 없습니다|찾을 수 없음|오류/')).toBeVisible({ timeout: 10000 });
    
    // Test recovery - go back to agents list
    const backButton = page.locator('a:has-text("에이전트 목록으로 돌아가기"), a[href="/agents"]').first();
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page).toHaveURL('/agents');
    }
  });
});