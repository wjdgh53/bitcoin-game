import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { mockAgents } from '../utils/mock-data';

test.describe('End-to-End User Flows', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Complete agent creation and interaction flow', async ({ page }) => {
    // Mock empty agents initially
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: []
    });

    // Navigate to agents page
    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Should show empty state
    await helpers.assertHeading('에이전트가 없습니다');
    await helpers.clickButton('첫 번째 에이전트 만들기');
    await helpers.waitForModal();

    // Create new agent
    const newAgent = {
      id: 'test-agent-1',
      name: 'Test Investment Bot',
      personality: 'balanced',
      description: 'A test agent for investment analysis',
      strategy: ['가치 투자', '장기 보유'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'balanced-agent-test'
    };

    // Mock successful creation and list response
    await helpers.mockApiResponse('**/api/agents', newAgent, 201);
    await helpers.mockApiResponse('**/api/agents?includeDetails=true', {
      success: true,
      agents: [{ ...newAgent, patterns: [], watchlistItems: [] }]
    });

    // Fill creation form
    await page.fill('input[name="name"], input[placeholder*="Warren Bot"]', newAgent.name);
    await page.selectOption('select', newAgent.personality);
    await page.fill('textarea', newAgent.description);
    
    // Select strategies
    for (const strategy of newAgent.strategy) {
      await page.check(`input[type="checkbox"]:near(:text("${strategy}"))`);
    }

    // Submit form
    await helpers.clickButton('생성하기');
    await page.waitForLoadState('networkidle');

    // Navigate to agent detail
    await helpers.mockApiResponse(`**/api/agents/${newAgent.id}`, {
      success: true,
      data: { ...newAgent, patterns: [], watchlistItems: [] }
    });

    await page.getByText(newAgent.name).click();
    await helpers.assertUrl(`http://localhost:3000/agents/${newAgent.id}`);
    await helpers.assertHeading(newAgent.name);

    // Navigate to chat with the agent
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: [newAgent]
    });
    await helpers.mockApiResponse(`**/api/chat/${newAgent.id}`, {
      success: true,
      messages: []
    });

    await page.click('a[href="/chat"]');
    await helpers.waitForLoadingToComplete();
    
    // Select agent in chat
    await page.getByText(newAgent.name).click();
    await helpers.assertHeading(newAgent.name);

    // Send message
    const testMessage = '안녕하세요, 현재 시장 상황에 대해 어떻게 생각하시나요?';
    const mockResponse = {
      userMessage: {
        id: 'msg-1',
        content: testMessage,
        type: 'user',
        createdAt: new Date().toISOString()
      },
      agentResponse: {
        id: 'msg-2',
        content: '안녕하세요! 현재 시장은 변동성이 큰 상황입니다. 균형잡힌 접근이 중요합니다.',
        type: 'agent',
        createdAt: new Date().toISOString()
      }
    };

    await helpers.mockApiResponse(`**/api/chat/${newAgent.id}`, mockResponse);
    
    const messageInput = page.locator('input[type="text"], textarea').last();
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');

    // Verify conversation
    await helpers.assertText(testMessage);
    await helpers.assertText('안녕하세요! 현재 시장은 변동성이 큰 상황입니다.');
  });

  test('Agent portfolio management flow', async ({ page }) => {
    const testAgent = {
      ...mockAgents[0],
      patterns: [],
      watchlistItems: []
    };

    // Mock APIs
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: [testAgent]
    });
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    // Navigate to agent detail
    await page.goto(`/agents/${testAgent.id}`);
    await helpers.waitForLoadingToComplete();

    // Add pattern
    await page.click('button:has-text("패턴")');
    await helpers.clickButton('새 패턴 추가');

    // Mock pattern creation
    const newPattern = {
      id: 'pattern-new',
      name: 'Test Pattern',
      description: 'A test trading pattern',
      priority: 2,
      confidenceRate: 80,
      examples: ['Test example'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}/patterns`, newPattern, 201);

    // Add watchlist item
    await page.click('button:has-text("관심종목")');
    await helpers.clickButton('종목 추가');

    // Mock watchlist creation
    const newWatchlistItem = {
      id: 'watchlist-new',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      category: '성장주',
      reason: 'EV market leader',
      agentView: 'Strong long-term potential',
      addedAt: new Date().toISOString(),
      lastReviewedAt: new Date().toISOString()
    };

    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}/watchlist`, newWatchlistItem, 201);

    // Verify the complete agent setup
    await page.click('button:has-text("개요")');
    await helpers.assertText(testAgent.description);
    await helpers.assertText('활성 패턴');
    await helpers.assertText('관심종목');
  });

  test('Multi-agent comparison flow', async ({ page }) => {
    // Mock multiple agents
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Compare different agent personalities
    const conservativeAgent = mockAgents.find(a => a.personality === 'conservative');
    const aggressiveAgent = mockAgents.find(a => a.personality === 'aggressive');

    if (conservativeAgent && aggressiveAgent) {
      // Check conservative agent
      await helpers.mockApiResponse(`**/api/agents/${conservativeAgent.id}`, {
        success: true,
        data: conservativeAgent
      });

      await page.getByText(conservativeAgent.name).click();
      await helpers.assertUrl(`http://localhost:3000/agents/${conservativeAgent.id}`);
      await helpers.assertText('conservative');
      await helpers.assertText('보수적');

      // Go back and check aggressive agent
      await page.click('[href="/agents"]');
      await page.getByText(aggressiveAgent.name).click();
      
      await helpers.mockApiResponse(`**/api/agents/${aggressiveAgent.id}`, {
        success: true,
        data: aggressiveAgent
      });

      await helpers.assertUrl(`http://localhost:3000/agents/${aggressiveAgent.id}`);
      await helpers.assertText('aggressive');
      await helpers.assertText('공격적');

      // Compare strategies
      await helpers.assertText('모멘텀 트레이딩');
      await helpers.assertText('단기 매매');
    }
  });

  test('Cross-platform navigation flow', async ({ page }) => {
    // Mock necessary APIs
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: mockAgents.slice(0, 1)
    });

    const testAgent = mockAgents[0];
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });
    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      messages: []
    });

    // Start from home
    await helpers.navigateToHome();
    
    // Navigate through all main sections
    await page.click('a[href="/dashboard"]');
    await helpers.assertUrl('http://localhost:3000/dashboard');

    await page.click('a[href="/reports"]');
    await helpers.assertUrl('http://localhost:3000/reports');

    await page.click('a[href="/agents"]');
    await helpers.assertUrl('http://localhost:3000/agents');
    await helpers.waitForLoadingToComplete();

    // Go to specific agent
    await page.getByText(testAgent.name).click();
    await helpers.assertUrl(`http://localhost:3000/agents/${testAgent.id}`);

    // Navigate to chat from agent detail
    await page.click('a[href="/chat"]');
    await helpers.assertUrl('http://localhost:3000/chat');
    await helpers.waitForLoadingToComplete();

    // Agent should be auto-selected or selectable
    await page.getByText(testAgent.name).click();
    await helpers.assertHeading(testAgent.name);

    // Return to home
    await page.click('a[href="/"]');
    await helpers.assertUrl('http://localhost:3000/');
  });

  test('Error recovery flow', async ({ page }) => {
    // Start with working state
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Simulate API error
    await helpers.mockApiResponse('**/api/agents/non-existent', {
      success: false,
      message: 'Agent not found'
    }, 404);

    // Try to navigate to non-existent agent
    await page.goto('/agents/non-existent');
    
    // Should show error state
    await helpers.assertHeading('에이전트를 찾을 수 없습니다');
    
    // Should be able to recover by going back
    await page.click('[href="/agents"]');
    await helpers.assertUrl('http://localhost:3000/agents');
    await helpers.assertHeading('AI 투자 에이전트');

    // Should still be functional
    await page.getByText(mockAgents[0].name).first().click();
    
    await helpers.mockApiResponse(`**/api/agents/${mockAgents[0].id}`, {
      success: true,
      data: mockAgents[0]
    });

    await helpers.assertUrl(`http://localhost:3000/agents/${mockAgents[0].id}`);
  });

  test('Mobile responsive flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mock APIs
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: mockAgents.slice(0, 2)
    });

    const testAgent = mockAgents[0];
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    // Navigate through app on mobile
    await helpers.navigateToHome();
    await expect(page.locator('nav')).toBeVisible();

    // Agents page on mobile
    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();
    await helpers.assertHeading('AI 투자 에이전트');

    // Should be able to create agent on mobile
    await helpers.clickButton('에이전트 추가');
    await helpers.waitForModal();
    await helpers.assertHeading('새 에이전트 생성');

    // Close modal and navigate to existing agent
    await helpers.clickButton('취소');
    await page.getByText(testAgent.name).click();
    await helpers.assertUrl(`http://localhost:3000/agents/${testAgent.id}`);

    // Agent detail should work on mobile
    await helpers.assertHeading(testAgent.name);
    
    // Tab navigation should work
    await page.click('button:has-text("패턴")');
    await helpers.assertHeading('트레이딩 패턴');

    // Chat should work on mobile
    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      messages: []
    });

    await page.click('a[href="/chat"]');
    await helpers.waitForLoadingToComplete();
    await page.getByText(testAgent.name).click();

    // Should have chat interface on mobile
    await expect(page.locator('input[type="text"], textarea').last()).toBeVisible();
  });

  test('Performance and loading flow', async ({ page }) => {
    // Test with many agents to check performance
    const manyAgents = Array(20).fill(null).map((_, i) => ({
      ...mockAgents[0],
      id: `agent-${i}`,
      name: `Test Agent ${i + 1}`,
    }));

    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: manyAgents
    });

    const startTime = Date.now();
    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();
    const endTime = Date.now();

    // Page should load within reasonable time
    expect(endTime - startTime).toBeLessThan(10000);

    // All agents should be visible
    for (let i = 0; i < Math.min(5, manyAgents.length); i++) {
      await helpers.assertText(`Test Agent ${i + 1}`);
    }

    // Scrolling should work smoothly
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(100);

    // Should still be responsive
    await helpers.clickButton('에이전트 추가');
    await helpers.waitForModal();
    await helpers.assertHeading('새 에이전트 생성');
  });

  test('Data persistence flow', async ({ page }) => {
    const testAgent = mockAgents[0];

    // Mock agent creation
    await helpers.mockApiResponse('**/api/agents', testAgent, 201);
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: [testAgent]
    });
    await helpers.mockApiResponse(`**/api/agents/${testAgent.id}`, {
      success: true,
      data: testAgent
    });

    // Create or select agent
    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Navigate to agent detail
    await page.getByText(testAgent.name).click();
    await helpers.assertUrl(`http://localhost:3000/agents/${testAgent.id}`);

    // Refresh page - data should persist
    await page.reload();
    await helpers.waitForLoadingToComplete();
    await helpers.assertHeading(testAgent.name);
    await helpers.assertText(testAgent.description);

    // Navigate away and back - state should be maintained
    await page.click('a[href="/dashboard"]');
    await page.click('a[href="/agents"]');
    await page.getByText(testAgent.name).click();
    await helpers.assertUrl(`http://localhost:3000/agents/${testAgent.id}`);

    // Data should still be there
    await helpers.assertHeading(testAgent.name);
    await helpers.assertText(testAgent.description);
  });
});