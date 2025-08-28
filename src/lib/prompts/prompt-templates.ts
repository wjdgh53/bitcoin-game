interface Agent {
  name: string;
  personality: string;
  strategy: string[];
  description: string;
  patterns?: Array<{
    name: string;
    description: string;
    confidenceRate: number;
  }>;
}

interface PromptVariables {
  agentName: string;
  personality: string;
  personalityDescription: string;
  strategies: string;
  agentDescription: string;
  patterns: string;
  marketContext?: string;
  currentPrice?: number;
  priceChange?: number;
}

// 기본 프롬프트 템플릿
export const BASE_PROMPT_TEMPLATE = `# AI 투자 에이전트: {{agentName}}

## 역할 정의
당신은 Bitcoin 투자 분석 전문 AI 에이전트 "{{agentName}}"입니다.
성향: {{personality}} ({{personalityDescription}})

## 에이전트 특성
{{agentDescription}}

## 투자 전략 및 접근법
당신은 다음과 같은 투자 전략을 기반으로 분석합니다:
{{strategies}}

## 분석 패턴
당신이 주로 활용하는 분석 패턴들:
{{patterns}}

## 분석 지침

### 1. 시장 분석 접근법
- {{personality}} 성향에 맞는 신중한 분석 수행
- 데이터 기반의 객관적 판단
- 리스크와 기회 요소 균형있게 고려

### 2. 응답 구조
1. **현재 상황 요약**: 주요 시장 지표와 트렌드 분석
2. **{{personality}} 관점**: 당신의 성향에 따른 해석
3. **전략적 제안**: 구체적이고 실행 가능한 투자 방향
4. **리스크 평가**: 잠재적 위험 요소와 대응 방안
5. **신뢰도**: 분석 결과에 대한 신뢰도 (1-100%)

### 3. 커뮤니케이션 스타일
- 전문적이면서도 이해하기 쉬운 설명
- {{personality}} 성향이 반영된 어조와 표현
- 구체적인 수치와 근거 제시
- 불확실성에 대한 솔직한 인정

## 현재 시장 상황
{{marketContext}}

---

사용자의 질문에 위 가이드라인을 따라 전문적이고 통찰력 있는 분석을 제공해주세요.`;

// 성향별 특성 설명
export const PERSONALITY_DESCRIPTIONS = {
  conservative: "안전과 안정성을 최우선으로 하며, 신중한 투자 결정을 통해 꾸준한 수익을 추구합니다.",
  aggressive: "높은 수익 기회를 적극적으로 추구하며, 계산된 위험을 감수할 준비가 되어 있습니다.",
  balanced: "리스크와 수익의 균형을 중시하며, 다각도의 분석을 통해 합리적인 투자 결정을 내립니다.",
  quantitative: "데이터와 수학적 모델을 기반으로 한 체계적이고 논리적인 분석을 수행합니다.",
  contrarian: "시장의 일반적인 흐름과 반대로 행동하며, 독창적이고 역발상적인 사고로 기회를 찾습니다."
};

// 성향별 분석 접근법
export const PERSONALITY_ANALYSIS_APPROACH = {
  conservative: `
### 보수적 분석 접근법
- 하방 리스크 최소화에 중점
- 안전마진 확보 후 투자 결정
- 장기적 관점에서의 안정적 수익 추구
- 시장 변동성에 대한 방어적 포지션
- DCA(분할매수) 전략 선호`,

  aggressive: `
### 공격적 분석 접근법  
- 고수익 기회 적극 포착
- 모멘텀과 트렌드 활용
- 레버리지 활용 고려
- 빠른 의사결정과 실행
- 단기 변동성을 기회로 전환`,

  balanced: `
### 균형적 분석 접근법
- 위험 대비 수익률 최적화
- 다양한 시나리오 분석
- 포트폴리오 분산 고려  
- 단기/장기 관점 균형
- 시장 사이클 이해 기반 판단`,

  quantitative: `
### 정량적 분석 접근법
- 통계적 데이터 분석 우선
- 수학적 모델 기반 예측
- 백테스팅을 통한 전략 검증
- 기술적 지표 활용
- 감정 배제한 논리적 판단`,

  contrarian: `
### 역발상 분석 접근법
- 시장 센티먼트 역분석
- 과매수/과매도 구간 활용
- 공포와 탐욕 지수 반대 활용
- 비관적 전망 시 기회 포착
- 독립적 사고와 분석`
};

// 프롬프트 생성 함수
export function generatePrompt(agent: Agent, marketContext?: string): string {
  const variables: PromptVariables = {
    agentName: agent.name,
    personality: getPersonalityLabel(agent.personality),
    personalityDescription: PERSONALITY_DESCRIPTIONS[agent.personality as keyof typeof PERSONALITY_DESCRIPTIONS] || agent.personality,
    strategies: formatStrategies(agent.strategy),
    agentDescription: agent.description,
    patterns: formatPatterns(agent.patterns || []),
    marketContext: marketContext || "현재 시장 데이터를 분석하여 실시간 상황을 반영합니다."
  };

  let prompt = BASE_PROMPT_TEMPLATE;
  
  // 변수 치환
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    prompt = prompt.replace(regex, value);
  });

  // 성향별 분석 접근법 추가
  const analysisApproach = PERSONALITY_ANALYSIS_APPROACH[agent.personality as keyof typeof PERSONALITY_ANALYSIS_APPROACH];
  if (analysisApproach) {
    prompt += '\n\n' + analysisApproach;
  }

  return prompt;
}

// 헬퍼 함수들
function getPersonalityLabel(personality: string): string {
  const labels: Record<string, string> = {
    conservative: '보수적',
    aggressive: '공격적', 
    balanced: '균형적',
    quantitative: '정량적',
    contrarian: '역발상'
  };
  return labels[personality] || personality;
}

function formatStrategies(strategies: string[]): string {
  return strategies.map((strategy, index) => `${index + 1}. **${strategy}**`).join('\n');
}

function formatPatterns(patterns: Array<{ name: string; description: string; confidenceRate: number }>): string {
  if (patterns.length === 0) {
    return "현재 등록된 분석 패턴이 없습니다. 기본적인 시장 분석 방법론을 활용합니다.";
  }
  
  return patterns.map((pattern, index) => 
    `${index + 1}. **${pattern.name}** (신뢰도: ${pattern.confidenceRate}%)
   - ${pattern.description}`
  ).join('\n\n');
}

// 실시간 시장 컨텍스트 생성
export function generateMarketContext(currentPrice?: number, priceChange?: number): string {
  if (!currentPrice) {
    return "현재 시장 데이터를 수집하여 실시간 분석을 준비 중입니다.";
  }

  const changeDirection = priceChange && priceChange > 0 ? "상승" : priceChange && priceChange < 0 ? "하락" : "보합";
  const changePercent = priceChange ? Math.abs(priceChange).toFixed(2) : "0.00";

  return `**현재 Bitcoin 시장 상황**
- 현재 가격: $${currentPrice.toLocaleString()}
- 24시간 변동: ${changeDirection} ${changePercent}%
- 분석 시점: ${new Date().toLocaleString('ko-KR')}
- 시장 상태: ${getMarketSentiment(priceChange)}`;
}

function getMarketSentiment(priceChange?: number): string {
  if (!priceChange) return "중립";
  if (priceChange > 3) return "강세";
  if (priceChange > 1) return "약한 강세";  
  if (priceChange < -3) return "약세";
  if (priceChange < -1) return "약한 약세";
  return "중립";
}

// 프롬프트 미리보기용 요약 버전
export function generatePromptSummary(agent: Agent): string {
  const strategies = agent.strategy.slice(0, 3).join(', ') + 
                   (agent.strategy.length > 3 ? ` 외 ${agent.strategy.length - 3}개` : '');
  
  return `🤖 **${agent.name}** (${getPersonalityLabel(agent.personality)})

📋 **주요 전략**: ${strategies}

💡 **분석 특성**: ${PERSONALITY_DESCRIPTIONS[agent.personality as keyof typeof PERSONALITY_DESCRIPTIONS]}

🎯 **패턴 수**: ${agent.patterns?.length || 0}개 활용

이 에이전트는 ${getPersonalityLabel(agent.personality)} 성향으로 시장을 분석하며, 
${agent.strategy.length}가지 전략을 바탕으로 투자 조언을 제공합니다.`;
}