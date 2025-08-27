# Bitcoin Game - Playwright Test Suite

이 문서는 Bitcoin Game 프로젝트의 종합적인 Playwright 테스트 스위트에 대한 설명입니다.

## 📋 테스트 개요

### 테스트 범위
- **네비게이션 및 기본 UI 테스트**: 앱의 기본 네비게이션과 UI 컴포넌트
- **에이전트 기능 테스트**: AI 투자 에이전트의 생성, 조회, 관리 기능
- **채팅 기능 테스트**: AI 에이전트와의 실시간 채팅 인터페이스
- **대시보드 및 리포트 테스트**: 포트폴리오 대시보드와 투자 리포트
- **API 엔드포인트 테스트**: 백엔드 API의 정확성과 안정성
- **E2E 사용자 플로우 테스트**: 실제 사용자 시나리오 전체 플로우

### 테스트 구조
```
tests/
├── api/                    # API 테스트
│   ├── agents-api.spec.ts  # 에이전트 API 테스트
│   ├── chat-api.spec.ts    # 채팅 API 테스트
│   └── bitcoin-api.spec.ts # 비트코인 API 테스트
├── e2e/                    # E2E 테스트
│   ├── navigation.spec.ts  # 네비게이션 테스트
│   ├── home-page.spec.ts   # 홈페이지 테스트
│   ├── agents-list.spec.ts # 에이전트 목록 테스트
│   ├── agent-detail.spec.ts# 에이전트 상세 테스트
│   ├── chat.spec.ts        # 채팅 기능 테스트
│   ├── dashboard-reports.spec.ts # 대시보드/리포트 테스트
│   └── user-flows.spec.ts  # 사용자 플로우 테스트
├── utils/                  # 테스트 유틸리티
│   ├── test-helpers.ts     # 헬퍼 함수들
│   └── mock-data.ts        # 모킹 데이터
└── run-all-tests.ts        # 종합 테스트 실행기
```

## 🚀 테스트 실행 방법

### 사전 요구사항
1. 개발 서버가 실행 중이어야 합니다:
   ```bash
   npm run dev
   ```

2. 데이터베이스가 설정되어 있어야 합니다:
   ```bash
   npm run init-db
   ```

### 기본 테스트 명령어

```bash
# 모든 테스트 실행
npm test

# UI 모드로 테스트 실행 (시각적 인터페이스)
npm run test:ui

# 헤드풀 모드로 테스트 실행 (브라우저가 보임)
npm run test:headed

# 디버그 모드로 테스트 실행
npm run test:debug

# API 테스트만 실행
npm run test:api

# E2E 테스트만 실행
npm run test:e2e

# 스모크 테스트 (기본적인 네비게이션 테스트)
npm run test:smoke

# 테스트 결과 리포트 보기
npm run test:report
```

### 종합 테스트 실행기
```bash
# 모든 테스트를 순차적으로 실행하고 종합 리포트 생성
tsx tests/run-all-tests.ts
```

## 📊 테스트 결과 해석

### 테스트 상태
- ✅ **Passed**: 테스트가 성공적으로 통과
- ❌ **Failed**: 테스트가 실패
- ⏭️ **Skipped**: 테스트가 건너뜀 (조건에 맞지 않거나 의도적으로 비활성화)

### 테스트 리포트
테스트 실행 후 다음 위치에서 상세한 리포트를 확인할 수 있습니다:
- HTML 리포트: `playwright-report/index.html`
- JSON 리포트: `test-results/comprehensive-report.json`
- 스크린샷: `test-results/screenshots/`

## 🧪 개별 테스트 파일 설명

### 1. Navigation Tests (`navigation.spec.ts`)
- 메인 네비게이션 바 표시 확인
- 페이지 간 네비게이션 기능
- 활성 페이지 하이라이트
- 키보드 네비게이션
- 모바일 반응형 테스트

### 2. Agents Tests (`agents-list.spec.ts`, `agent-detail.spec.ts`)
- 에이전트 목록 표시
- 에이전트 생성 모달
- 에이전트 폼 유효성 검증
- 에이전트 상세 페이지
- 패턴 및 관심종목 관리
- 빈 상태 처리

### 3. Chat Tests (`chat.spec.ts`)
- 채팅 인터페이스 로딩
- 에이전트 선택 및 필터링
- 메시지 송수신
- 키보드 단축키
- 오류 처리

### 4. Dashboard Tests (`dashboard-reports.spec.ts`)
- 대시보드 데이터 표시
- 비트코인 가격 정보
- 포트폴리오 정보
- 리포트 목록 및 상세보기
- 실시간 데이터 업데이트

### 5. API Tests (`*-api.spec.ts`)
- REST API 엔드포인트 테스트
- 요청/응답 데이터 유효성
- 오류 상황 처리
- 동시성 테스트
- 속도 제한 테스트

### 6. User Flow Tests (`user-flows.spec.ts`)
- 에이전트 생성부터 채팅까지의 전체 플로우
- 크로스 플랫폼 네비게이션
- 데이터 지속성 테스트
- 오류 복구 시나리오
- 모바일 사용자 플로우

## 🛠 테스트 헬퍼 및 유틸리티

### TestHelpers 클래스
`tests/utils/test-helpers.ts`에 정의된 유틸리티 함수들:

```typescript
// 페이지 네비게이션
await helpers.navigateToHome();
await helpers.navigateToAgents();

// 요소 대기
await helpers.waitForElement('#my-element');
await helpers.waitForText('Expected Text');

// 폼 작성
await helpers.fillForm({ name: 'Test', email: 'test@example.com' });

// 검증
await helpers.assertHeading('Page Title');
await helpers.assertText('Some text');

// API 모킹
await helpers.mockApiResponse('/api/agents', mockData);
```

### Mock Data
`tests/utils/mock-data.ts`에서 테스트용 데이터를 관리:
- 에이전트 데이터
- 채팅 메시지
- 비트코인 가격 데이터
- 포트폴리오 정보
- 거래 내역

## 🚨 일반적인 문제 해결

### 1. 테스트 타임아웃
```bash
# 타임아웃 시간 증가
npx playwright test --timeout=60000
```

### 2. 개발 서버 연결 실패
```bash
# 개발 서버가 실행 중인지 확인
curl http://localhost:3000
```

### 3. 데이터베이스 문제
```bash
# 데이터베이스 재초기화
npm run init-db
```

### 4. 브라우저 설치 문제
```bash
# 브라우저 재설치
npx playwright install
```

## 📈 테스트 성능 최적화

### 병렬 실행
기본적으로 Playwright는 테스트를 병렬로 실행합니다. 성능을 조정하려면:

```bash
# 워커 수 조정
npx playwright test --workers=4
```

### 테스트 분리
- 독립적인 테스트 작성
- 전역 상태 변경 최소화
- 모킹을 통한 외부 의존성 제거

## 🔧 CI/CD 통합

### GitHub Actions 예시
```yaml
- name: Run Playwright tests
  run: |
    npm run build
    npm run start &
    sleep 10
    npm test
```

## 📝 베스트 프랙티스

### 테스트 작성 원칙
1. **독립성**: 각 테스트는 다른 테스트에 의존하지 않아야 함
2. **가독성**: 테스트 이름은 명확하고 설명적이어야 함
3. **신뢰성**: 안정적이고 일관된 결과를 제공해야 함
4. **유지보수성**: 쉽게 수정하고 확장할 수 있어야 함

### 좋은 테스트의 예
```typescript
test('should create new agent with valid data', async ({ page }) => {
  // Given: 에이전트 페이지로 이동
  await helpers.navigateToAgents();
  
  // When: 새 에이전트 생성
  await helpers.createTestAgent({
    name: 'Test Agent',
    personality: 'balanced',
    description: 'Test description'
  });
  
  // Then: 에이전트가 생성되고 목록에 표시됨
  await helpers.assertText('Test Agent');
});
```

## 🤝 기여하기

### 새 테스트 추가
1. 적절한 디렉토리에 테스트 파일 생성
2. TestHelpers 클래스 활용
3. Mock 데이터 사용
4. 문서 업데이트

### 테스트 개선
1. 커버리지 분석
2. 불안정한 테스트 수정
3. 성능 개선
4. 새로운 헬퍼 함수 추가

---

## 📞 지원

테스트 관련 문제가 있으면 다음을 확인하세요:

1. 이 문서의 문제 해결 섹션
2. Playwright 공식 문서: https://playwright.dev/
3. 프로젝트 이슈 트래커

테스트 스위트는 지속적으로 개선되고 있습니다. 피드백과 제안을 환영합니다!