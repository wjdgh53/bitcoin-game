import { test, expect } from '@playwright/test';

test.describe('Trading Features - Agent Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to agent detail page
    await page.goto('/agents/agent-1');
    await page.waitForLoadState('networkidle');
  });

  test('should display trading history tab and navigate to it', async ({ page }) => {
    // Check if trading history tab exists
    const tradingTab = page.getByRole('button', { name: /거래 내역/i });
    await expect(tradingTab).toBeVisible();
    
    // Click on trading history tab
    await tradingTab.click();
    
    // Verify trading history content is displayed
    await expect(page.getByRole('heading', { name: '거래 내역' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should filter trading history by action type', async ({ page }) => {
    // Navigate to trading history tab
    await page.getByRole('button', { name: /거래 내역/i }).click();
    
    // Open filters
    await page.getByRole('button', { name: /필터/i }).click();
    
    // Select BUY filter
    await page.getByLabel('거래 유형').selectOption('BUY');
    
    // Check that only BUY transactions are shown
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const actionCell = rows.nth(i).locator('td').nth(2);
      await expect(actionCell).toContainText('매수');
    }
  });

  test('should sort trading history by date', async ({ page }) => {
    // Navigate to trading history tab
    await page.getByRole('button', { name: /거래 내역/i }).click();
    
    // Click on date column header to sort
    await page.getByRole('columnheader', { name: /날짜/i }).click();
    
    // Verify sorting changes
    const firstDateBefore = await page.locator('tbody tr').first().locator('td').first().textContent();
    
    // Click again to reverse sort
    await page.getByRole('columnheader', { name: /날짜/i }).click();
    
    const firstDateAfter = await page.locator('tbody tr').first().locator('td').first().textContent();
    expect(firstDateBefore).not.toBe(firstDateAfter);
  });

  test('should export trading history to CSV', async ({ page }) => {
    // Navigate to trading history tab
    await page.getByRole('button', { name: /거래 내역/i }).click();
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click CSV export button
    await page.getByRole('button', { name: /CSV/i }).click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should display performance metrics dashboard', async ({ page }) => {
    // Navigate to performance tab
    await page.getByRole('button', { name: /성과 분석/i }).click();
    
    // Check key metrics are displayed
    await expect(page.getByRole('heading', { name: '성과 분석' })).toBeVisible();
    
    // Check metric cards
    await expect(page.getByText('총 수익률')).toBeVisible();
    await expect(page.getByText('승률')).toBeVisible();
    await expect(page.getByText('샤프 비율')).toBeVisible();
    await expect(page.getByText('최대 낙폭')).toBeVisible();
  });

  test('should switch between different chart views in performance metrics', async ({ page }) => {
    // Navigate to performance tab
    await page.getByRole('button', { name: /성과 분석/i }).click();
    
    // Check equity curve is default
    await expect(page.getByRole('button', { name: '자산 곡선' })).toHaveClass(/bg-blue-500/);
    
    // Switch to returns chart
    await page.getByRole('button', { name: '수익률' }).click();
    await expect(page.getByRole('button', { name: '수익률' })).toHaveClass(/bg-blue-500/);
    
    // Switch to drawdown chart
    await page.getByRole('button', { name: '낙폭' }).click();
    await expect(page.getByRole('button', { name: '낙폭' })).toHaveClass(/bg-blue-500/);
  });

  test('should change timeframe for performance charts', async ({ page }) => {
    // Navigate to performance tab
    await page.getByRole('button', { name: /성과 분석/i }).click();
    
    // Click different timeframe buttons
    await page.getByRole('button', { name: '1M' }).click();
    await expect(page.getByRole('button', { name: '1M' })).toHaveClass(/bg-white/);
    
    await page.getByRole('button', { name: '3M' }).click();
    await expect(page.getByRole('button', { name: '3M' })).toHaveClass(/bg-white/);
    
    await page.getByRole('button', { name: 'ALL' }).click();
    await expect(page.getByRole('button', { name: 'ALL' })).toHaveClass(/bg-white/);
  });

  test('should display enhanced prompts viewer', async ({ page }) => {
    // Navigate to enhanced prompts tab
    await page.getByRole('button', { name: /프롬프트 상세/i }).click();
    
    // Check prompts are displayed
    await expect(page.getByRole('heading', { name: '프롬프트 상세 관리' })).toBeVisible();
    
    // Check category sections exist
    await expect(page.getByText('성격 정의')).toBeVisible();
    await expect(page.getByText('투자 전략')).toBeVisible();
    await expect(page.getByText('분석 방법')).toBeVisible();
  });

  test('should expand and collapse prompt categories', async ({ page }) => {
    // Navigate to enhanced prompts tab
    await page.getByRole('button', { name: /프롬프트 상세/i }).click();
    
    // Find a category button
    const categoryButton = page.getByRole('button', { name: /성격 정의/i }).first();
    
    // Check if expanded (should show content)
    const isExpanded = await page.locator('.bg-gray-900').first().isVisible();
    
    // Click to toggle
    await categoryButton.click();
    
    // Check visibility changed
    const isExpandedAfter = await page.locator('.bg-gray-900').first().isVisible();
    expect(isExpanded).not.toBe(isExpandedAfter);
  });

  test('should copy prompt content to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Navigate to enhanced prompts tab
    await page.getByRole('button', { name: /프롬프트 상세/i }).click();
    
    // Expand a category if needed
    const categoryButton = page.getByRole('button', { name: /성격 정의/i }).first();
    await categoryButton.click();
    
    // Click copy button
    const copyButton = page.getByRole('button', { name: /프롬프트 복사/i }).first();
    await copyButton.click();
    
    // Check for success indicator
    await expect(copyButton).toContainText('✓');
  });

  test('should show prompt version history', async ({ page }) => {
    // Navigate to enhanced prompts tab
    await page.getByRole('button', { name: /프롬프트 상세/i }).click();
    
    // Expand a category
    const categoryButton = page.getByRole('button', { name: /성격 정의/i }).first();
    await categoryButton.click();
    
    // Look for version history link
    const historyLink = page.getByText(/이전 버전/i).first();
    
    if (await historyLink.isVisible()) {
      await historyLink.click();
      
      // Check version history is displayed
      await expect(page.getByText('버전 히스토리')).toBeVisible();
    }
  });

  test('should search in trading history', async ({ page }) => {
    // Navigate to trading history tab
    await page.getByRole('button', { name: /거래 내역/i }).click();
    
    // Type in search box
    const searchInput = page.getByPlaceholder(/검색/i);
    await searchInput.fill('BTC');
    
    // Check that results are filtered
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      // Check at least one row contains BTC
      const hasMatch = await rows.locator(':has-text("BTC")').count() > 0;
      expect(hasMatch).toBeTruthy();
    }
  });

  test('should paginate trading history', async ({ page }) => {
    // Navigate to trading history tab
    await page.getByRole('button', { name: /거래 내역/i }).click();
    
    // Check pagination exists
    const nextButton = page.locator('button:has(svg[class*="ChevronRight"])');
    
    if (await nextButton.isEnabled()) {
      // Get first row content before pagination
      const firstRowBefore = await page.locator('tbody tr').first().textContent();
      
      // Click next page
      await nextButton.click();
      
      // Get first row content after pagination
      const firstRowAfter = await page.locator('tbody tr').first().textContent();
      
      // Content should be different
      expect(firstRowBefore).not.toBe(firstRowAfter);
    }
  });

  test('should display monthly returns heatmap', async ({ page }) => {
    // Navigate to performance tab
    await page.getByRole('button', { name: /성과 분석/i }).click();
    
    // Scroll to heatmap section
    await page.getByText('월별 수익률 히트맵').scrollIntoViewIfNeeded();
    
    // Check heatmap is visible
    await expect(page.getByText('월별 수익률 히트맵')).toBeVisible();
    
    // Check month labels exist
    await expect(page.getByText('1월')).toBeVisible();
    await expect(page.getByText('12월')).toBeVisible();
  });

  test('should display best and worst trades', async ({ page }) => {
    // Navigate to performance tab
    await page.getByRole('button', { name: /성과 분석/i }).click();
    
    // Check best/worst trade cards
    await expect(page.getByText('최고 수익 거래')).toBeVisible();
    await expect(page.getByText('최대 손실 거래')).toBeVisible();
  });
});

test.describe('Trading Features - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display trading features on mobile', async ({ page }) => {
    // Navigate to agent detail page
    await page.goto('/agents/agent-1');
    await page.waitForLoadState('networkidle');
    
    // Check tabs are scrollable on mobile
    const tabContainer = page.locator('nav').first();
    await expect(tabContainer).toHaveCSS('overflow-x', 'auto');
    
    // Navigate to trading history
    await page.getByRole('button', { name: /거래 내역/i }).click();
    
    // Check table is scrollable
    const tableContainer = page.locator('.overflow-x-auto').first();
    await expect(tableContainer).toBeVisible();
    
    // Navigate to performance
    await page.getByRole('button', { name: /성과 분석/i }).click();
    
    // Check responsive grid layout
    const metricsGrid = page.locator('.grid').first();
    await expect(metricsGrid).toHaveClass(/grid-cols-1/);
  });
});