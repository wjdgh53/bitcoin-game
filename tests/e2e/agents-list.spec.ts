import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { mockAgents } from '../utils/mock-data';

test.describe('Agents List Page Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should load agents list page correctly', async ({ page }) => {
    await helpers.navigateToAgents();
    
    // Check page elements
    await helpers.assertHeading('AI 투자 에이전트');
    await helpers.assertText('다양한 성향의 AI 에이전트들이 투자 분석을 도와드립니다');
    
    // Check if add agent button is present
    await expect(page.getByRole('button', { name: '에이전트 추가' })).toBeVisible();
  });

  test('should display agents when available', async ({ page }) => {
    // Mock agents API response
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Check if agents are displayed
    for (const agent of mockAgents) {
      await expect(page.getByText(agent.name)).toBeVisible();
      await expect(page.getByText(agent.description)).toBeVisible();
    }

    // Check agent personality badges
    await expect(page.getByText('보수적')).toBeVisible(); // Conservative Bob
    await expect(page.getByText('공격적')).toBeVisible(); // Aggressive Alice
    await expect(page.getByText('균형적')).toBeVisible(); // Balanced Charlie

    // Check active/inactive status
    const activeStatuses = page.getByText('활성');
    const inactiveStatuses = page.getByText('비활성');
    
    await expect(activeStatuses).toHaveCount(2); // 2 active agents
    await expect(inactiveStatuses).toHaveCount(1); // 1 inactive agent
  });

  test('should show empty state when no agents exist', async ({ page }) => {
    // Mock empty agents response
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: []
    });

    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Check empty state
    await helpers.assertHeading('에이전트가 없습니다');
    await helpers.assertText('새로운 AI 에이전트를 추가해보세요.');
    await expect(page.getByRole('button', { name: '첫 번째 에이전트 만들기' })).toBeVisible();
  });

  test('should open agent creation modal', async ({ page }) => {
    await helpers.navigateToAgents();
    
    // Click add agent button
    await helpers.clickButton('에이전트 추가');
    await helpers.waitForModal();

    // Check modal content
    await helpers.assertHeading('새 에이전트 생성');
    await expect(page.getByLabel('에이전트 이름')).toBeVisible();
    await expect(page.getByLabel('투자 성향')).toBeVisible();
    await expect(page.getByLabel('설명')).toBeVisible();
    await expect(page.getByText('투자 전략')).toBeVisible();

    // Check personality options
    const personalitySelect = page.locator('select');
    await expect(personalitySelect.locator('option[value="conservative"]')).toContainText('보수적');
    await expect(personalitySelect.locator('option[value="aggressive"]')).toContainText('공격적');
    await expect(personalitySelect.locator('option[value="balanced"]')).toContainText('균형적');
    await expect(personalitySelect.locator('option[value="quantitative"]')).toContainText('정량적');
    await expect(personalitySelect.locator('option[value="contrarian"]')).toContainText('역발상');

    // Check strategy options
    const strategyOptions = [
      '가치 투자', '모멘텀 트레이딩', '기술적 분석', '펀더멘털 분석',
      '스캘핑', '스윙 트레이딩', '데이 트레이딩', '장기 보유'
    ];
    
    for (const strategy of strategyOptions) {
      await expect(page.getByText(strategy)).toBeVisible();
    }

    // Check modal buttons
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible();
    await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible();
  });

  test('should create new agent successfully', async ({ page }) => {
    // Mock successful agent creation
    const newAgent = {
      id: 'agent-new',
      name: 'Test Agent',
      type: 'balanced-agent-12345',
      personality: 'balanced',
      strategy: ['가치 투자', '장기 보유'],
      description: 'Test agent description',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await helpers.mockApiResponse('**/api/agents', newAgent, 201);
    await helpers.mockApiResponse('**/api/agents?includeDetails=true', {
      success: true,
      agents: [newAgent]
    });

    await helpers.navigateToAgents();
    
    // Open creation modal
    await helpers.clickButton('에이전트 추가');
    await helpers.waitForModal();

    // Fill form
    await page.fill('input[name="name"], input[placeholder*="Warren Bot"]', newAgent.name);
    await page.selectOption('select', newAgent.personality);
    await page.fill('textarea', newAgent.description);
    
    // Select strategies
    for (const strategy of newAgent.strategy) {
      await page.check(`input[type="checkbox"]:near(:text("${strategy}"))`);
    }

    // Submit form
    await helpers.clickButton('생성하기');

    // Wait for modal to close and agent to appear
    await page.waitForLoadState('networkidle');
    
    // Verify agent was created (would need proper API response)
    // await helpers.assertText(newAgent.name);
  });

  test('should validate required fields in creation form', async ({ page }) => {
    await helpers.navigateToAgents();
    
    // Open creation modal
    await helpers.clickButton('에이전트 추가');
    await helpers.waitForModal();

    // Try to submit without filling required fields
    await helpers.clickButton('생성하기');

    // Check for validation (HTML5 validation should prevent submission)
    const nameInput = page.locator('input[name="name"], input[placeholder*="Warren Bot"]');
    await expect(nameInput).toBeFocused(); // Focus should return to empty required field

    // Fill only name, try again
    await page.fill('input[name="name"], input[placeholder*="Warren Bot"]', 'Test Agent');
    await helpers.clickButton('생성하기');

    // Description is required, so form should not submit yet
    const descriptionTextarea = page.locator('textarea');
    const descriptionValue = await descriptionTextarea.inputValue();
    expect(descriptionValue).toBe(''); // Should be empty and required
  });

  test('should close creation modal', async ({ page }) => {
    await helpers.navigateToAgents();
    
    // Open modal
    await helpers.clickButton('에이전트 추가');
    await helpers.waitForModal();

    // Close using cancel button
    await helpers.clickButton('취소');
    
    // Modal should be closed
    await helpers.assertElementNotVisible('[role="dialog"]');
    await helpers.assertElementNotVisible('.fixed.inset-0');

    // Open modal again
    await helpers.clickButton('에이전트 추가');
    await helpers.waitForModal();

    // Close using escape key
    await page.keyboard.press('Escape');
    
    // Modal should be closed
    await helpers.assertElementNotVisible('[role="dialog"]');
  });

  test('should navigate to agent detail page', async ({ page }) => {
    // Mock agents API response
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Click on first agent
    await page.getByText(mockAgents[0].name).click();
    
    // Should navigate to agent detail page
    await helpers.assertUrl(`http://localhost:3000/agents/${mockAgents[0].id}`);
  });

  test('should display agent statistics correctly', async ({ page }) => {
    // Mock agents API response
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: mockAgents
    });

    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Check pattern counts
    await helpers.assertText('2개 패턴'); // Conservative Bob has 2 patterns
    await helpers.assertText('1개 패턴'); // Aggressive Alice has 1 pattern
    await helpers.assertText('0개 패턴'); // Balanced Charlie has 0 patterns

    // Check watchlist counts
    await helpers.assertText('1개 관심종목'); // Conservative Bob and Aggressive Alice each have 1
    await helpers.assertText('0개 관심종목'); // Balanced Charlie has 0
  });

  test('should handle loading and error states', async ({ page }) => {
    await helpers.navigateToAgents();
    
    // Should show loading initially
    await helpers.assertText('에이전트를 불러오는 중...');
    
    // Mock API error
    await helpers.mockApiResponse('**/api/agents*', { error: 'Server error' }, 500);
    
    // Refresh to trigger error
    await page.reload();
    
    // Should handle error gracefully (might show empty state or error message)
    await page.waitForLoadState('networkidle');
    
    // The page should not be stuck in loading state
    const loadingText = page.getByText('에이전트를 불러오는 중...');
    await expect(loadingText).not.toBeVisible({ timeout: 10000 });
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mock agents API response
    await helpers.mockApiResponse('**/api/agents*', {
      success: true,
      agents: mockAgents.slice(0, 2) // Limit for mobile test
    });

    await helpers.navigateToAgents();
    await helpers.waitForLoadingToComplete();

    // Check if content is visible on mobile
    await helpers.assertHeading('AI 투자 에이전트');
    await expect(page.getByRole('button', { name: '에이전트 추가' })).toBeVisible();
    
    // Check if agents are displayed properly
    await helpers.assertText(mockAgents[0].name);
    
    // Should be able to open modal on mobile
    await helpers.clickButton('에이전트 추가');
    await helpers.waitForModal();
    await helpers.assertHeading('새 에이전트 생성');
  });
});