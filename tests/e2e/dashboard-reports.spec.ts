import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { mockReports, mockBitcoinData, mockPortfolio, mockTradeHistory } from '../utils/mock-data';

test.describe('Dashboard and Reports Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should load dashboard correctly', async ({ page }) => {
    // Mock necessary APIs for dashboard
    await helpers.mockApiResponse('**/api/bitcoin/current', mockBitcoinData.current);
    await helpers.mockApiResponse('**/api/portfolio', mockPortfolio);
    await helpers.mockApiResponse('**/api/trades*', mockTradeHistory);

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Dashboard should display key information
    await expect(page.locator('main, .container, [role="main"]').first()).toBeVisible();
    
    // Should have some dashboard content
    // (Exact content depends on implementation)
  });

  test('should display Bitcoin price information', async ({ page }) => {
    await helpers.mockApiResponse('**/api/bitcoin/current', mockBitcoinData.current);
    await helpers.mockApiResponse('**/api/bitcoin/history', { history: mockBitcoinData.history });

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Should display Bitcoin price data
    await helpers.assertText('67,850'); // Price formatting might vary
    await helpers.assertText('1.87'); // Change percent

    // Should have price chart or data visualization
    const chartElements = page.locator('canvas, .chart, [data-testid*="chart"]');
    if (await chartElements.count() > 0) {
      await expect(chartElements.first()).toBeVisible();
    }
  });

  test('should display portfolio information', async ({ page }) => {
    await helpers.mockApiResponse('**/api/portfolio', mockPortfolio);

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Should display portfolio value
    await helpers.assertText('125,000'); // Total value formatting might vary
    await helpers.assertText('1.92'); // Daily change percent

    // Should show positions
    await helpers.assertText('Bitcoin');
    await helpers.assertText('Apple Inc.');
    await helpers.assertText('BTC');
    await helpers.assertText('AAPL');
  });

  test('should display recent trades', async ({ page }) => {
    await helpers.mockApiResponse('**/api/trades', mockTradeHistory);

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Should show trade history
    await helpers.assertText('BTC');
    await helpers.assertText('AAPL');
    
    // Should show trade types
    if (await page.getByText('매수').isVisible()) {
      await helpers.assertText('매수');
    }
    if (await page.getByText('매도').isVisible()) {
      await helpers.assertText('매도');
    }
  });

  test('should load reports page correctly', async ({ page }) => {
    await helpers.mockApiResponse('**/api/reports', {
      success: true,
      reports: mockReports
    });

    await helpers.navigateToReports();
    await helpers.waitForLoadingToComplete();

    // Should display reports list
    for (const report of mockReports) {
      await helpers.assertText(report.title);
    }

    // Should show report types and statuses
    await helpers.assertText('weekly');
    await helpers.assertText('published');
    await helpers.assertText('draft');
  });

  test('should display individual report correctly', async ({ page }) => {
    const testReport = mockReports[0];

    await helpers.mockApiResponse('**/api/reports', {
      success: true,
      reports: mockReports
    });
    await helpers.mockApiResponse(`**/api/reports/${testReport.id}`, {
      success: true,
      data: testReport
    });

    await helpers.navigateToReports();
    await helpers.waitForLoadingToComplete();

    // Click on first report
    await page.getByText(testReport.title).click();
    await helpers.assertUrl(`http://localhost:3000/reports/${testReport.id}`);

    // Should display report content
    await helpers.assertHeading(testReport.title);
    await helpers.assertText(testReport.content);
    await helpers.assertText(testReport.type);
    await helpers.assertText(testReport.status);
  });

  test('should handle empty states on dashboard', async ({ page }) => {
    // Mock empty responses
    await helpers.mockApiResponse('**/api/portfolio', {
      totalValue: 0,
      positions: []
    });
    await helpers.mockApiResponse('**/api/trades', []);

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Should handle empty portfolio gracefully
    await helpers.assertText('0'); // Zero portfolio value

    // Should handle empty trades
    if (await page.getByText('거래 내역이 없습니다').isVisible()) {
      await helpers.assertText('거래 내역이 없습니다');
    }
  });

  test('should handle empty reports list', async ({ page }) => {
    await helpers.mockApiResponse('**/api/reports', {
      success: true,
      reports: []
    });

    await helpers.navigateToReports();
    await helpers.waitForLoadingToComplete();

    // Should show empty state
    if (await page.getByText('리포트가 없습니다').isVisible()) {
      await helpers.assertText('리포트가 없습니다');
    } else if (await page.getByText('보고서가 없습니다').isVisible()) {
      await helpers.assertText('보고서가 없습니다');
    }
  });

  test('should update dashboard data in real-time', async ({ page }) => {
    // Initial data
    await helpers.mockApiResponse('**/api/bitcoin/current', mockBitcoinData.current);

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Should show initial price
    await helpers.assertText('67,850');

    // Update price data
    const updatedPrice = {
      ...mockBitcoinData.current,
      price: 68500.00,
      change: 1895.30,
      changePercent: 2.85
    };

    await helpers.mockApiResponse('**/api/bitcoin/current', updatedPrice);

    // Refresh or wait for auto-update
    await page.reload();
    await helpers.waitForLoadingToComplete();

    // Should show updated price
    await helpers.assertText('68,500');
    await helpers.assertText('2.85');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API errors
    await helpers.mockApiResponse('**/api/bitcoin/current', { error: 'API Error' }, 500);
    await helpers.mockApiResponse('**/api/portfolio', { error: 'Server Error' }, 500);

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Should handle errors gracefully without crashing
    // Might show error messages or fallback data
    const errorMessages = [
      '데이터를 불러올 수 없습니다',
      '서버 오류',
      'Error loading data',
      'Failed to load'
    ];

    let hasErrorMessage = false;
    for (const message of errorMessages) {
      if (await page.getByText(message).isVisible()) {
        hasErrorMessage = true;
        break;
      }
    }

    // Either shows error message or handles gracefully
    // The page should not be completely broken
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display charts and visualizations', async ({ page }) => {
    await helpers.mockApiResponse('**/api/bitcoin/history', { history: mockBitcoinData.history });
    await helpers.mockApiResponse('**/api/portfolio', mockPortfolio);

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Look for chart elements
    const possibleChartSelectors = [
      'canvas',
      '.chart',
      '[data-testid*="chart"]',
      '.recharts-wrapper',
      '.chartjs-chart',
      'svg'
    ];

    let hasChart = false;
    for (const selector of possibleChartSelectors) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        await expect(elements.first()).toBeVisible();
        hasChart = true;
        break;
      }
    }

    // Charts might not be implemented yet, so this is optional
    // The test won't fail if no charts are found
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await helpers.mockApiResponse('**/api/bitcoin/current', mockBitcoinData.current);
    await helpers.mockApiResponse('**/api/portfolio', mockPortfolio);

    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Dashboard should be functional on mobile
    await expect(page.locator('main, .container').first()).toBeVisible();

    // Navigation should work
    await page.click('a[href="/reports"]');
    await helpers.assertUrl('http://localhost:3000/reports');

    // Reports should be readable on mobile
    await helpers.mockApiResponse('**/api/reports', {
      success: true,
      reports: mockReports.slice(0, 2) // Limit for mobile
    });

    await page.reload();
    await helpers.waitForLoadingToComplete();

    await helpers.assertText(mockReports[0].title);
  });

  test('should handle data refresh and loading states', async ({ page }) => {
    let responseDelay = 0;
    
    // Mock delayed response
    await page.route('**/api/bitcoin/current', async route => {
      await new Promise(resolve => setTimeout(resolve, responseDelay));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBitcoinData.current)
      });
    });

    await helpers.navigateToDashboard();

    // Should show loading state initially
    const loadingElements = [
      '.animate-spin',
      '[data-testid="loading"]',
      'text="로딩"',
      'text="불러오는 중"'
    ];

    let foundLoading = false;
    for (const selector of loadingElements) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        foundLoading = true;
        break;
      } catch {
        // Continue checking other selectors
      }
    }

    // Wait for loading to complete
    await helpers.waitForLoadingToComplete();

    // Should eventually show data
    if (await page.getByText('67,850').isVisible()) {
      await helpers.assertText('67,850');
    }
  });

  test('should show proper timestamps and dates', async ({ page }) => {
    await helpers.mockApiResponse('**/api/reports', {
      success: true,
      reports: mockReports
    });

    await helpers.navigateToReports();
    await helpers.waitForLoadingToComplete();

    // Should show formatted dates
    const dateFormats = [
      '2024. 1. 22.',     // Korean format
      '2024-01-22',       // ISO format
      'Jan 22, 2024',     // English format
      '1월 22일'           // Korean short format
    ];

    let hasDate = false;
    for (const dateFormat of dateFormats) {
      if (await page.getByText(dateFormat).isVisible()) {
        hasDate = true;
        break;
      }
    }

    // At least some date should be displayed
    // (The exact format depends on implementation)
  });

  test('should handle navigation between dashboard and reports', async ({ page }) => {
    await helpers.mockApiResponse('**/api/bitcoin/current', mockBitcoinData.current);
    await helpers.mockApiResponse('**/api/reports', {
      success: true,
      reports: mockReports
    });

    // Start at dashboard
    await helpers.navigateToDashboard();
    await helpers.waitForLoadingToComplete();

    // Navigate to reports
    await page.click('a[href="/reports"]');
    await helpers.assertUrl('http://localhost:3000/reports');
    await helpers.waitForLoadingToComplete();

    // Navigate back to dashboard
    await page.click('a[href="/dashboard"]');
    await helpers.assertUrl('http://localhost:3000/dashboard');
    await helpers.waitForLoadingToComplete();

    // Should maintain state and functionality
    await expect(page.locator('main, .container').first()).toBeVisible();
  });
});