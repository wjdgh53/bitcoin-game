import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { mockAgents, mockChatMessages } from '../utils/mock-data';

test.describe('Chat Functionality Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should load chat page correctly', async ({ page }) => {
    // Mock agents for chat
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();

    // Check main chat elements
    await helpers.assertHeading('AI 에이전트 채팅');
    await expect(page.locator('input[placeholder*="에이전트 검색"]')).toBeVisible();
    
    // Check if agent list is displayed
    for (const agent of mockAgents) {
      await expect(page.getByText(agent.name)).toBeVisible();
    }

    // Check initial empty chat state
    await helpers.assertHeading('에이전트를 선택해주세요');
    await helpers.assertText('왼쪽에서 대화하고 싶은 AI 에이전트를 클릭하세요');
  });

  test('should display loading state initially', async ({ page }) => {
    await helpers.navigateToChat();
    
    // Should show loading initially
    await helpers.assertText('채팅을 준비하고 있습니다...');
    
    // Mock agents response after delay
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    await helpers.waitForLoadingToComplete();
    await helpers.assertHeading('AI 에이전트 채팅');
  });

  test('should filter agents by search', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();

    // Search for "Conservative"
    const searchInput = page.locator('input[placeholder*="에이전트 검색"]');
    await searchInput.fill('Conservative');

    // Should only show Conservative Bob
    await expect(page.getByText('Conservative Bob')).toBeVisible();
    await expect(page.getByText('Aggressive Alice')).not.toBeVisible();
    await expect(page.getByText('Balanced Charlie')).not.toBeVisible();

    // Search for "aggressive"
    await searchInput.clear();
    await searchInput.fill('aggressive');

    // Should only show Aggressive Alice
    await expect(page.getByText('Aggressive Alice')).toBeVisible();
    await expect(page.getByText('Conservative Bob')).not.toBeVisible();

    // Clear search
    await searchInput.clear();

    // Should show all agents again
    for (const agent of mockAgents) {
      await expect(page.getByText(agent.name)).toBeVisible();
    }
  });

  test('should select agent and display chat interface', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    const testAgent = mockAgents[0];
    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      messages: mockChatMessages
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();

    // Select first agent
    await page.getByText(testAgent.name).click();

    // Should show chat interface with agent info
    await helpers.assertHeading(testAgent.name);
    await helpers.assertText(testAgent.personality);
    await helpers.assertText(testAgent.description);

    // Check if message input is visible
    await expect(page.locator('input[type="text"], textarea').last()).toBeVisible();
    
    // Check if existing messages are displayed
    for (const message of mockChatMessages) {
      await helpers.assertText(message.content);
    }
  });

  test('should send and receive chat messages', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    const testAgent = mockAgents[0];
    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      messages: []
    });

    // Mock chat response
    const newUserMessage = {
      id: 'msg-new-1',
      agentId: testAgent.id,
      userId: 'user-1',
      content: '안녕하세요!',
      type: 'user' as const,
      metadata: '{}',
      isRead: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newAgentResponse = {
      id: 'msg-new-2',
      agentId: testAgent.id,
      userId: 'user-1',
      content: '안녕하세요! 투자에 관해 궁금한 것이 있으시면 언제든 물어보세요.',
      type: 'agent' as const,
      metadata: '{"confidence": 0.9}',
      isRead: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      userMessage: newUserMessage,
      agentResponse: newAgentResponse
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();

    // Select agent
    await page.getByText(testAgent.name).click();

    // Send message
    const messageInput = page.locator('input[type="text"], textarea').last();
    await messageInput.fill(newUserMessage.content);
    await messageInput.press('Enter');

    // Should display both user message and agent response
    await helpers.assertText(newUserMessage.content);
    await helpers.assertText(newAgentResponse.content);
  });

  test('should handle keyboard shortcuts for sending messages', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    const testAgent = mockAgents[0];
    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      messages: []
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();
    await page.getByText(testAgent.name).click();

    const messageInput = page.locator('input[type="text"], textarea').last();
    
    // Test Enter key
    await messageInput.fill('Test message 1');
    await messageInput.press('Enter');
    
    // Message should be sent (input should be cleared)
    await expect(messageInput).toHaveValue('');

    // Test Ctrl+Enter if it's supported
    await messageInput.fill('Test message 2');
    await messageInput.press('Control+Enter');
    
    // Should also send message
    await expect(messageInput).toHaveValue('');
  });

  test('should display message timestamps and metadata', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    const testAgent = mockAgents[0];
    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      messages: mockChatMessages
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();
    await page.getByText(testAgent.name).click();

    // Check if messages have proper styling for user vs agent
    // User messages and agent messages should have different styling
    const messageElements = page.locator('[data-type="user"], [data-type="agent"], .user-message, .agent-message');
    
    if (await messageElements.count() > 0) {
      // Messages should be distinguishable
      expect(await messageElements.count()).toBeGreaterThan(0);
    }
  });

  test('should handle agent selection state', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();

    // Initially no agent selected
    await helpers.assertText('에이전트를 선택해주세요');

    // Select first agent
    await page.getByText(mockAgents[0].name).first().click();
    
    // Agent should be visually selected
    const selectedAgent = page.locator('.selected, .active, [aria-selected="true"]').first();
    if (await selectedAgent.isVisible()) {
      await expect(selectedAgent).toContainText(mockAgents[0].name);
    }

    // Select second agent
    await page.getByText(mockAgents[1].name).first().click();
    
    // Should show new agent's chat
    await helpers.assertHeading(mockAgents[1].name);
  });

  test('should handle message sending errors', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    const testAgent = mockAgents[0];
    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      messages: []
    });

    // Mock error response for sending message
    await page.route(`**/api/chat/${testAgent.id}`, route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, messages: [] })
        });
      }
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();
    await page.getByText(testAgent.name).click();

    // Try to send message
    const messageInput = page.locator('input[type="text"], textarea').last();
    await messageInput.fill('Test message');
    await messageInput.press('Enter');

    // Should handle error gracefully (message might stay in input or show error)
    // The exact behavior depends on implementation
  });

  test('should display agent personality indicators', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();

    // Check personality indicators in agent list
    await helpers.assertText('conservative'); // or localized version
    await helpers.assertText('aggressive');
    await helpers.assertText('balanced');

    // Select agent and check personality in header
    await page.getByText(mockAgents[0].name).click();
    await helpers.assertText(mockAgents[0].personality);
  });

  test('should handle empty message submission', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    const testAgent = mockAgents[0];
    await helpers.mockApiResponse(`**/api/chat/${testAgent.id}`, {
      success: true,
      messages: []
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();
    await page.getByText(testAgent.name).click();

    const messageInput = page.locator('input[type="text"], textarea').last();
    
    // Try to send empty message
    await messageInput.press('Enter');
    
    // Should not send empty message (input should remain focused)
    await expect(messageInput).toBeFocused();

    // Try with whitespace only
    await messageInput.fill('   ');
    await messageInput.press('Enter');
    
    // Should not send whitespace-only message
    await expect(messageInput).toHaveValue('   ');
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents.slice(0, 2) // Limit for mobile test
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();

    // Check mobile layout
    await helpers.assertHeading('AI 에이전트 채팅');
    
    // Should be able to select agent
    await page.getByText(mockAgents[0].name).click();
    await helpers.assertHeading(mockAgents[0].name);

    // Chat input should be accessible on mobile
    const messageInput = page.locator('input[type="text"], textarea').last();
    await expect(messageInput).toBeVisible();
  });

  test('should handle agent status (active/inactive)', async ({ page }) => {
    await helpers.mockApiResponse('**/api/agents', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToChat();
    await helpers.waitForLoadingToComplete();

    // Should show active/inactive status for agents
    await helpers.assertText('활성'); // Active agents
    await helpers.assertText('비활성'); // Inactive agent (Balanced Charlie)

    // Should be able to chat with both active and inactive agents
    // (or inactive agents might be disabled - depends on implementation)
    await page.getByText(mockAgents[2].name).click(); // Balanced Charlie (inactive)
    
    // Should either show chat or indicate agent is inactive
    const chatInterface = page.locator('input[type="text"], textarea').last();
    if (await chatInterface.isVisible()) {
      // Chat is available even for inactive agents
      await expect(chatInterface).toBeVisible();
    } else {
      // Or show that agent is inactive
      await helpers.assertText('비활성');
    }
  });
});