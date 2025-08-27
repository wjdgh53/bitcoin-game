import { Page, Locator, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToHome() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAgents() {
    await this.page.goto('/agents');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToChat() {
    await this.page.goto('/chat');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToReports() {
    await this.page.goto('/reports');
    await this.page.waitForLoadState('networkidle');
  }

  // Wait helpers
  async waitForElement(selector: string, timeout: number = 10000) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout: number = 10000) {
    return await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  async waitForApiCall(url: string, timeout: number = 10000) {
    return await this.page.waitForResponse(url, { timeout });
  }

  // Form helpers
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const input = this.page.locator(`[name="${field}"], [placeholder*="${field}"], label:has-text("${field}") + input`).first();
      if (await input.isVisible()) {
        await input.fill(value);
      }
    }
  }

  async selectDropdownOption(selector: string, option: string) {
    await this.page.locator(selector).selectOption(option);
  }

  async clickButton(text: string) {
    await this.page.getByRole('button', { name: text }).click();
  }

  // Assertion helpers
  async assertPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  async assertHeading(text: string) {
    await expect(this.page.getByRole('heading', { name: text })).toBeVisible();
  }

  async assertText(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async assertElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async assertElementNotVisible(selector: string) {
    await expect(this.page.locator(selector)).not.toBeVisible();
  }

  async assertUrl(expectedUrl: string) {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  // Loading state helpers
  async waitForLoadingToComplete() {
    // Wait for loading spinner to disappear
    const spinnerSelectors = [
      '[data-testid="loading"]',
      '.animate-spin',
      'text="불러오는 중"',
      'text="로딩"'
    ];

    for (const selector of spinnerSelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'hidden', timeout: 5000 });
      } catch {
        // Selector not found, continue
      }
    }
  }

  // Screenshot helper
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }

  // Modal helpers
  async waitForModal() {
    await this.page.waitForSelector('[role="dialog"], .modal, .fixed.inset-0', { state: 'visible' });
  }

  async closeModal() {
    // Try multiple common modal close methods
    const closeSelectors = [
      '[aria-label="Close"]',
      '[data-testid="close-modal"]',
      'button:has-text("닫기")',
      'button:has-text("취소")',
      '[role="button"]:has([data-icon="x"])'
    ];

    for (const selector of closeSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
  }

  // API helpers
  async mockApiResponse(url: string, response: any, status: number = 200) {
    await this.page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  // Agent-specific helpers
  async createTestAgent(agentData: {
    name: string;
    personality: string;
    description: string;
    strategies?: string[];
  }) {
    await this.navigateToAgents();
    await this.clickButton('에이전트 추가');
    await this.waitForModal();

    await this.page.fill('input[name="name"]', agentData.name);
    await this.page.selectOption('select[name="personality"]', agentData.personality);
    await this.page.fill('textarea[name="description"]', agentData.description);

    if (agentData.strategies) {
      for (const strategy of agentData.strategies) {
        await this.page.check(`input[type="checkbox"]:near(:text("${strategy}"))`);
      }
    }

    await this.clickButton('생성하기');
    await this.waitForLoadingToComplete();
  }

  async selectAgent(agentName: string) {
    await this.page.getByText(agentName).click();
    await this.waitForLoadingToComplete();
  }

  // Chat-specific helpers
  async sendChatMessage(message: string) {
    await this.page.fill('input[type="text"], textarea', message);
    await this.page.keyboard.press('Enter');
    await this.waitForLoadingToComplete();
  }

  async waitForChatResponse(timeout: number = 15000) {
    // Wait for agent response to appear
    await this.page.waitForSelector('.agent-message, [data-type="agent"]', { timeout });
  }

  // Network helpers
  async interceptApiRequests() {
    const requests: any[] = [];
    
    this.page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    return requests;
  }
}