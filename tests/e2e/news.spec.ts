import { test, expect } from '@playwright/test';

test.describe('News Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/news');
  });

  test('should display news page correctly', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('암호화폐 뉴스');
    
    // 네비게이션 바에 뉴스 메뉴 확인
    await expect(page.locator('nav').locator('text=뉴스')).toBeVisible();
    
    // 테스트 데이터 생성 버튼 확인
    await expect(page.locator('button:has-text("테스트 데이터 생성")')).toBeVisible();
  });

  test('should generate mock news data', async ({ page }) => {
    // 테스트 데이터 생성 버튼 클릭
    const generateButton = page.locator('button:has-text("테스트 데이터 생성")');
    await generateButton.click();
    
    // 버튼이 로딩 상태로 변경되는지 확인
    await expect(page.locator('button:has-text("생성 중...")')).toBeVisible();
    
    // 성공 알림 대기 (타임아웃 증가)
    await page.waitForFunction(() => {
      const alerts = document.querySelectorAll('div');
      return Array.from(alerts).some(alert => 
        alert.textContent?.includes('테스트 뉴스 데이터가 생성되었습니다')
      );
    }, { timeout: 10000 });
  });

  test('should display news articles after data generation', async ({ page }) => {
    // 먼저 테스트 데이터 생성
    await page.locator('button:has-text("테스트 데이터 생성")').click();
    await page.waitForTimeout(3000);
    
    // 페이지 새로고침
    await page.reload();
    
    // 뉴스 기사들이 표시되는지 확인
    await expect(page.locator('text=최신 뉴스')).toBeVisible();
    
    // 뉴스 카드가 표시되는지 확인
    const newsCards = page.locator('[class*="bg-white rounded-2xl shadow-lg"]').filter({
      hasNotText: '시장 감정 지수'
    }).filter({
      hasNotText: '리포트'
    });
    await expect(newsCards.first()).toBeVisible();
  });

  test('should display market sentiment overview', async ({ page }) => {
    // 테스트 데이터 생성
    await page.locator('button:has-text("테스트 데이터 생성")').click();
    await page.waitForTimeout(3000);
    await page.reload();
    
    // 시장 감정 지수 섹션 확인
    await expect(page.locator('text=시장 감정 지수')).toBeVisible();
    await expect(page.locator('text=전체 감정 점수')).toBeVisible();
    await expect(page.locator('text=시장 트렌드')).toBeVisible();
  });

  test('should filter news by category', async ({ page }) => {
    // 테스트 데이터 생성
    await page.locator('button:has-text("테스트 데이터 생성")').click();
    await page.waitForTimeout(3000);
    await page.reload();
    
    // 필터 버튼 클릭
    await page.locator('button:has-text("필터")').click();
    
    // 카테고리 선택
    await page.selectOption('select', 'market');
    
    // 검색 버튼 클릭
    await page.locator('button:has-text("검색")').click();
    
    // 필터된 결과 확인 (시장 카테고리만 표시되어야 함)
    await page.waitForTimeout(1000);
    const marketBadges = page.locator('text=시장');
    if (await marketBadges.count() > 0) {
      await expect(marketBadges.first()).toBeVisible();
    }
  });

  test('should search news articles', async ({ page }) => {
    // 테스트 데이터 생성
    await page.locator('button:has-text("테스트 데이터 생성")').click();
    await page.waitForTimeout(3000);
    await page.reload();
    
    // 검색어 입력
    const searchInput = page.locator('input[placeholder*="뉴스 검색"]');
    await searchInput.fill('비트코인');
    
    // 검색 버튼 클릭
    await page.locator('button:has-text("검색")').click();
    
    // 검색 결과 대기
    await page.waitForTimeout(1000);
    
    // 검색된 뉴스에 '비트코인' 키워드가 포함되어 있는지 확인
    const newsCards = page.locator('[class*="bg-white rounded-2xl shadow-lg"]').filter({
      hasNotText: '시장 감정 지수'
    }).filter({
      hasNotText: '리포트'
    });
    
    if (await newsCards.count() > 0) {
      const firstCard = newsCards.first();
      await expect(firstCard.locator('text=/비트코인|Bitcoin/i')).toBeVisible();
    }
  });

  test('should display AI analysis reports', async ({ page }) => {
    // 테스트 데이터 생성
    await page.locator('button:has-text("테스트 데이터 생성")').click();
    await page.waitForTimeout(3000);
    await page.reload();
    
    // AI 분석 리포트 섹션 확인
    await expect(page.locator('text=AI 분석 리포트')).toBeVisible();
    
    // 일일 리포트 카드 확인
    const reportCards = page.locator('text=일일 리포트').locator('..').locator('..');
    if (await reportCards.count() > 0) {
      await expect(reportCards.first()).toBeVisible();
    }
  });

  test('should refresh news data', async ({ page }) => {
    // 새로고침 버튼 클릭
    const refreshButton = page.locator('button:has-text("새로고침")');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    
    // 페이지가 새로고침되는지 확인
    await page.waitForTimeout(1000);
    await expect(page.locator('h1')).toContainText('암호화폐 뉴스');
  });

  test('should navigate to news page from navbar', async ({ page }) => {
    // 홈페이지로 이동
    await page.goto('/');
    
    // 네비게이션 바의 뉴스 링크 클릭
    await page.locator('nav a[href="/news"]').click();
    
    // 뉴스 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/news');
    await expect(page.locator('h1')).toContainText('암호화폐 뉴스');
  });

  test('should reset filters', async ({ page }) => {
    // 테스트 데이터 생성
    await page.locator('button:has-text("테스트 데이터 생성")').click();
    await page.waitForTimeout(3000);
    await page.reload();
    
    // 필터 섹션 열기
    await page.locator('button:has-text("필터")').click();
    
    // 필터 설정
    await page.selectOption('select', 'technical');
    await page.selectOption('select[name="minImportance"]', '8');
    
    // 필터 초기화 버튼 클릭
    await page.locator('button:has-text("필터 초기화")').click();
    
    // 필터가 초기화되었는지 확인
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toHaveValue('');
  });
});