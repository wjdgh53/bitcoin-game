import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { mockAgents } from '../utils/mock-data';

test.describe('Agent Detail Page Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should load agent detail page correctly', async ({ page }) => {
    const testAgent = mockAgents[0]; // Conservative Bob
    
    // Mock agent detail API response
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    await page.goto(`/agents/${testAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Check agent header information
    await helpers.assertHeading(testAgent.name);
    await helpers.assertText(testAgent.personality);
    await helpers.assertText(testAgent.isActive ? '활성' : '비활성');
    
    // Check if back button is present
    await expect(page.locator('[href="/agents"]')).toBeVisible();
    
    // Check creation date
    await helpers.assertText('생성일');
    await helpers.assertText('2024. 1. 15.');
  });

  test('should display agent overview correctly', async ({ page }) => {
    const testAgent = mockAgents[0];
    
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    await page.goto(`/agents/${testAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Check overview tab is active by default
    const overviewTab = page.locator('button:has-text("개요")');
    await expect(overviewTab).toHaveClass(/border-blue-500/);
    await expect(overviewTab).toHaveClass(/text-blue-600/);

    // Check agent description
    await helpers.assertHeading('에이전트 설명');
    await helpers.assertText(testAgent.description);

    // Check strategy overview
    await helpers.assertHeading('전략 개요');
    for (const strategy of testAgent.strategy) {
      await helpers.assertText(strategy);
    }

    // Check quick stats
    await helpers.assertText('활성 패턴');
    await helpers.assertText('관심종목');
    await helpers.assertText('평균 신뢰도');
    
    // Verify stats numbers
    const activePatterns = testAgent.patterns.filter(p => p.isActive).length;
    await helpers.assertText(activePatterns.toString());
    await helpers.assertText(testAgent.watchlistItems.length.toString());
  });

  test('should display patterns tab correctly', async ({ page }) => {
    const testAgent = mockAgents[0];
    
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    await page.goto(`/agents/${testAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Click patterns tab
    await page.click('button:has-text("패턴")');

    // Check patterns tab content
    await helpers.assertHeading('트레이딩 패턴');
    await expect(page.getByRole('button', { name: '새 패턴 추가' })).toBeVisible();

    // Check each pattern
    for (const pattern of testAgent.patterns) {
      await helpers.assertText(pattern.name);
      await helpers.assertText(pattern.description);
      await helpers.assertText(`신뢰도: ${pattern.confidenceRate}%`);
      await helpers.assertText(`우선순위: ${pattern.priority}`);
      
      // Check priority label
      if (pattern.priority <= 2) {
        await helpers.assertText('높음');
      } else if (pattern.priority <= 4) {
        await helpers.assertText('보통');
      } else {
        await helpers.assertText('낮음');
      }

      // Check pattern examples
      if (pattern.examples.length > 0) {
        await helpers.assertText('패턴 예시');
        for (const example of pattern.examples) {
          await helpers.assertText(example);
        }
      }
    }
  });

  test('should display watchlist tab correctly', async ({ page }) => {
    const testAgent = mockAgents[0];
    
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    await page.goto(`/agents/${testAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Click watchlist tab
    await page.click('button:has-text("관심종목")');

    // Check watchlist tab content
    await helpers.assertHeading('관심종목');
    await expect(page.getByRole('button', { name: '종목 추가' })).toBeVisible();

    // Check each watchlist item
    for (const item of testAgent.watchlistItems) {
      await helpers.assertText(`${item.symbol} - ${item.name}`);
      await helpers.assertText(item.category);
      await helpers.assertText('관심 이유');
      await helpers.assertText(item.reason);
      await helpers.assertText('에이전트 견해');
      await helpers.assertText(item.agentView);
      
      if (item.alertPrice) {
        await helpers.assertText(`$${item.alertPrice.toLocaleString()}`);
      }

      // Check dates
      await helpers.assertText('추가: 2024. 1. 15.');
      await helpers.assertText('검토: 2024. 1. 20.');
    }
  });

  test('should handle tabs navigation correctly', async ({ page }) => {
    const testAgent = mockAgents[0];
    
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    await page.goto(`/agents/${testAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Test tab switching
    const tabs = ['overview', 'patterns', 'watchlist'];
    const tabTexts = ['개요', '패턴', '관심종목'];

    for (let i = 0; i < tabs.length; i++) {
      await page.click(`button:has-text("${tabTexts[i]}")`);
      
      // Check active tab styling
      const activeTab = page.locator(`button:has-text("${tabTexts[i]}")`);
      await expect(activeTab).toHaveClass(/border-blue-500/);
      await expect(activeTab).toHaveClass(/text-blue-600/);
      
      // Check other tabs are not active
      for (let j = 0; j < tabs.length; j++) {
        if (i !== j) {
          const inactiveTab = page.locator(`button:has-text("${tabTexts[j]}")`);
          await expect(inactiveTab).toHaveClass(/border-transparent/);
          await expect(inactiveTab).toHaveClass(/text-gray-500/);
        }
      }
    }
  });

  test('should handle empty states correctly', async ({ page }) => {
    const emptyAgent = {
      ...mockAgents[2], // Balanced Charlie has no patterns/watchlist
      patterns: [],
      watchlistItems: []
    };
    
    await helpers.mockApiResponse(`**/api/agents/${emptyAgent.id}`, {
      success: true,
      data: emptyAgent
    });

    await page.goto(`/agents/${emptyAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Check patterns empty state
    await page.click('button:has-text("패턴")');
    await helpers.assertHeading('패턴이 없습니다');
    await helpers.assertText('이 에이전트의 첫 번째 트레이딩 패턴을 추가해보세요.');
    await expect(page.getByRole('button', { name: '패턴 추가하기' })).toBeVisible();

    // Check watchlist empty state
    await page.click('button:has-text("관심종목")');
    await helpers.assertHeading('관심종목이 없습니다');
    await helpers.assertText('이 에이전트가 모니터링할 첫 번째 종목을 추가해보세요.');
    await expect(page.getByRole('button', { name: '종목 추가하기' })).toBeVisible();
  });

  test('should handle agent not found error', async ({ page }) => {
    const nonExistentId = 'non-existent-agent';
    
    // Mock 404 response
    await helpers.mockApiResponse(`**/api/agents/${nonExistentId}`, {
      success: false,
      message: 'Agent not found'
    }, 404);

    await page.goto(`/agents/${nonExistentId}`);
    await helpers.waitForLoadingToComplete();

    // Check error state
    await helpers.assertHeading('에이전트를 찾을 수 없습니다');
    await helpers.assertText('Agent not found');
    
    // Check back button
    const backButton = page.locator('[href="/agents"]');
    await expect(backButton).toBeVisible();
    await expect(backButton).toContainText('에이전트 목록으로 돌아가기');
  });

  test('should navigate back to agents list', async ({ page }) => {
    const testAgent = mockAgents[0];
    
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    await page.goto(`/agents/${testAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Click back button
    await page.click('[href="/agents"]');
    
    // Should navigate back to agents list
    await helpers.assertUrl('http://localhost:3000/agents');
  });

  test('should display personality-specific styling', async ({ page }) => {
    const conservativeAgent = mockAgents[0]; // Conservative
    const aggressiveAgent = mockAgents[1]; // Aggressive
    
    // Test conservative agent styling
    await helpers.mockApiResponse(`**/api/agents/${conservativeAgent.id}`, {
      success: true,
      data: conservativeAgent
    });

    await page.goto(`/agents/${conservativeAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Check conservative styling (blue theme)
    await expect(page.locator('.bg-blue-50')).toBeVisible();
    await expect(page.locator('.text-blue-600')).toBeVisible();

    // Test aggressive agent styling  
    await helpers.mockApiResponse(`**/api/agents/${aggressiveAgent.id}`, {
      success: true,
      data: aggressiveAgent
    });

    await page.goto(`/agents/${aggressiveAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Check aggressive styling (red theme)
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('.text-red-600')).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    const testAgent = mockAgents[0];
    
    // Navigate without mocking API first
    await page.goto(`/agents/${testAgent.id}`);
    
    // Should show loading state initially
    await helpers.assertText('에이전트 정보를 불러오는 중...');
    
    // Mock delayed response
    setTimeout(async () => {
      await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
        success: true,
        data: testAgent
      });
    }, 1000);

    // Wait for loading to complete
    await helpers.waitForLoadingToComplete();
  });

  test('should work on mobile devices', async ({ page }) => {
    const testAgent = mockAgents[0];
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    await page.goto(`/agents/${testAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Check if content is properly displayed on mobile
    await helpers.assertHeading(testAgent.name);
    await helpers.assertText(testAgent.description);
    
    // Check if tabs work on mobile
    await page.click('button:has-text("패턴")');
    await helpers.assertHeading('트레이딩 패턴');
    
    await page.click('button:has-text("관심종목")');
    await helpers.assertHeading('관심종목');
  });
});