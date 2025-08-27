import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const patternData = {
  conservative: [
    {
      name: "DCA 전략",
      description: "일정한 간격으로 동일한 금액을 투자하여 가격 변동성을 완화하는 패턴",
      priority: 1,
      confidenceRate: 85,
      examples: [
        "매주 월요일 $100 투자",
        "월급날마다 투자금액의 10% 투자",
        "가격이 20% 하락했을 때 추가 투자"
      ]
    },
    {
      name: "지지선 매수",
      description: "기술적 분석을 통해 확인된 강력한 지지선에서 매수하는 보수적 전략",
      priority: 2,
      confidenceRate: 78,
      examples: [
        "$50,000 지지선에서 매수",
        "200일 이동평균선 지지에서 매수",
        "피보나치 61.8% 되돌림 지점에서 매수"
      ]
    },
    {
      name: "장기 홀딩",
      description: "시장 변동성에 관계없이 장기간 보유하는 안정적인 투자 패턴",
      priority: 3,
      confidenceRate: 90,
      examples: [
        "최소 2년 이상 보유",
        "50% 이상 하락해도 보유 지속",
        "목표가 달성 시에만 부분 매도"
      ]
    }
  ],
  aggressive: [
    {
      name: "모멘텀 추종",
      description: "강한 상승 모멘텀을 감지하면 즉시 진입하는 공격적 전략",
      priority: 1,
      confidenceRate: 72,
      examples: [
        "5% 상승 시 즉시 매수",
        "거래량 급증과 함께 돌파 시 진입",
        "RSI 70 돌파 시 추가 매수"
      ]
    },
    {
      name: "레버리지 활용",
      description: "높은 수익을 위해 레버리지를 활용하는 고위험 고수익 패턴",
      priority: 2,
      confidenceRate: 65,
      examples: [
        "2-3배 레버리지 활용",
        "강세장에서 최대 레버리지 적용",
        "손절선 10% 설정으로 리스크 관리"
      ]
    },
    {
      name: "단기 스윙",
      description: "단기간의 가격 변동을 활용한 빠른 수익 실현 전략",
      priority: 3,
      confidenceRate: 68,
      examples: [
        "1-3일 보유 후 익절",
        "15-20% 수익 시 즉시 매도",
        "뉴스 이벤트 활용한 단기 매매"
      ]
    }
  ],
  quantitative: [
    {
      name: "RSI 역전 신호",
      description: "RSI 지표의 과매도/과매수 신호를 활용한 수학적 접근",
      priority: 1,
      confidenceRate: 82,
      examples: [
        "RSI 30 이하에서 매수",
        "RSI 70 이상에서 매도",
        "RSI 다이버전스 신호 활용"
      ]
    },
    {
      name: "볼린저 밴드 전략",
      description: "볼린저 밴드의 통계적 특성을 활용한 매매 패턴",
      priority: 2,
      confidenceRate: 76,
      examples: [
        "하단 밴드 터치 시 매수",
        "상단 밴드 근접 시 매도",
        "밴드 수축 후 확장 시 진입"
      ]
    },
    {
      name: "이동평균 크로스오버",
      description: "단기/장기 이동평균의 교차점을 활용한 시스템적 접근",
      priority: 3,
      confidenceRate: 70,
      examples: [
        "20일선이 50일선 상향 돌파 시 매수",
        "골든크로스 형성 시 매수",
        "데드크로스 형성 시 매도"
      ]
    }
  ],
  balanced: [
    {
      name: "분산 투자",
      description: "리스크를 분산하여 안정적인 수익을 추구하는 균형 전략",
      priority: 1,
      confidenceRate: 80,
      examples: [
        "BTC 50%, ETH 30%, 알트코인 20%",
        "월별 리밸런싱 실행",
        "섹터별 분산 투자"
      ]
    },
    {
      name: "목표 수익률 관리",
      description: "명확한 목표 수익률과 손실 한도를 설정하는 체계적 접근",
      priority: 2,
      confidenceRate: 85,
      examples: [
        "연 수익률 목표 15-25%",
        "최대 손실 한도 10%",
        "분기별 포트폴리오 검토"
      ]
    },
    {
      name: "시기별 전략 조정",
      description: "시장 상황에 따라 보수적/공격적 전략을 조정하는 적응형 패턴",
      priority: 3,
      confidenceRate: 78,
      examples: [
        "강세장: 70% 투자, 30% 현금",
        "약세장: 30% 투자, 70% 현금",
        "횡보장: 스윙 트레이딩 비중 증가"
      ]
    }
  ],
  contrarian: [
    {
      name: "공포 매수",
      description: "시장 공포 지수가 높을 때 역행 매수하는 반대 매매 전략",
      priority: 1,
      confidenceRate: 73,
      examples: [
        "공포탐욕지수 20 이하에서 매수",
        "시장 패닉 상황에서 적극 매수",
        "뉴스 악재 발생 시 기회 포착"
      ]
    },
    {
      name: "고점 매도",
      description: "시장이 과열되었을 때 수익 실현하는 타이밍 전략",
      priority: 2,
      confidenceRate: 68,
      examples: [
        "공포탐욕지수 80 이상에서 매도",
        "언론의 과도한 낙관론 시 매도",
        "신고점 갱신 후 분할 매도"
      ]
    },
    {
      name: "시장 센티먼트 역행",
      description: "대중의 심리와 반대로 행동하는 역발상 투자법",
      priority: 3,
      confidenceRate: 71,
      examples: [
        "소셜미디어 FUD 급증 시 매수",
        "기관 투자자 매도 시 매수",
        "소매 투자자 항복 시 진입"
      ]
    }
  ]
};

const watchlistData = {
  conservative: [
    {
      symbol: "BTC",
      name: "Bitcoin",
      category: "장기투자" as const,
      reason: "디지털 자산의 기축통화로서 장기적 가치 저장 수단",
      agentView: "장기적으로 $200,000까지 상승 가능하며, 인플레이션 헷지 자산으로 매력적",
      alertPrice: 45000
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      category: "장기투자" as const,
      reason: "스마트 컨트랙트 플랫폼의 선두주자이자 DeFi 생태계의 핵심",
      agentView: "이더리움 2.0 완전 이행 시 $10,000 달성 가능, 안정적인 성장세 예상",
      alertPrice: 2800
    },
    {
      symbol: "ADA",
      name: "Cardano",
      category: "안전자산" as const,
      reason: "학술적 접근과 엄격한 개발 과정을 통한 안정성",
      agentView: "느리지만 꾸준한 성장, 규제 친화적 특성으로 장기 투자에 적합",
      alertPrice: 0.35
    }
  ],
  aggressive: [
    {
      symbol: "BTC",
      name: "Bitcoin",
      category: "단기트레이딩" as const,
      reason: "높은 변동성과 거래량으로 단기 수익 기회가 풍부",
      agentView: "단기적으로 $150,000 돌파 가능, 레버리지 활용으로 고수익 추구",
      alertPrice: 120000
    },
    {
      symbol: "SOL",
      name: "Solana",
      category: "모멘텀" as const,
      reason: "빠른 성장과 높은 변동성으로 단기 수익 기회 제공",
      agentView: "강한 상승 모멘텀 시 200% 이상 수익 가능, 적극적 진입 추천",
      alertPrice: 180
    },
    {
      symbol: "DOGE",
      name: "Dogecoin",
      category: "투기적투자" as const,
      reason: "소셜미디어 영향력과 급격한 가격 변동성 활용",
      agentView: "일론 머스크 관련 뉴스 시 급등 가능, 단기 투기 목적으로 활용",
      alertPrice: 0.25
    }
  ],
  quantitative: [
    {
      symbol: "BTC",
      name: "Bitcoin",
      category: "가치투자" as const,
      reason: "충분한 역사적 데이터와 예측 가능한 패턴 보유",
      agentView: "통계적 모델 기준 현재 저평가, 회귀분석 결과 $95,000 적정가",
      alertPrice: 95000
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      category: "가치투자" as const,
      reason: "온체인 데이터와 네트워크 가치 분석을 통한 정량적 평가 가능",
      agentView: "NVT 비율 기준 적정 가격 $4,200, 현재 할인된 가격대",
      alertPrice: 4200
    },
    {
      symbol: "LINK",
      name: "Chainlink",
      category: "성장주" as const,
      reason: "오라클 네트워크 사용량과 TVL 지표를 통한 성장성 측정 가능",
      agentView: "네트워크 사용량 증가 추세, 정량적 지표상 50% 상승 여력",
      alertPrice: 20
    }
  ],
  balanced: [
    {
      symbol: "BTC",
      name: "Bitcoin",
      category: "장기투자" as const,
      reason: "포트폴리오의 안정적인 기반 자산으로서 균형 유지",
      agentView: "전체 포트폴리오의 40-50% 비중 유지, 안정성과 성장성의 균형",
      alertPrice: 100000
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      category: "장기투자" as const,
      reason: "BTC 대비 높은 성장성과 유틸리티 가치",
      agentView: "포트폴리오의 25-30% 비중, BTC 보완재로서 역할",
      alertPrice: 3500
    },
    {
      symbol: "BNB",
      name: "Binance Coin",
      category: "배당주" as const,
      reason: "거래소 토큰의 안정적인 수익원과 소각 매커니즘",
      agentView: "꾸준한 buyback으로 가치 상승, 안정적인 배당형 자산",
      alertPrice: 400
    }
  ],
  contrarian: [
    {
      symbol: "BTC",
      name: "Bitcoin",
      category: "대체투자" as const,
      reason: "대중의 감정과 반대로 투자하는 역발상 전략의 핵심 자산",
      agentView: "현재 과도한 비관론, 시장 공포 시 적극 매수 기회",
      alertPrice: 80000
    },
    {
      symbol: "XRP",
      name: "Ripple",
      category: "대체투자" as const,
      reason: "SEC 소송 등 악재로 인한 과도한 하락, 역전 기회 포착",
      agentView: "법적 리스크 해소 시 급반등 가능, 현재 저평가 상태",
      alertPrice: 1.0
    },
    {
      symbol: "ADA",
      name: "Cardano",
      category: "대체투자" as const,
      reason: "개발 지연에 대한 시장의 과도한 실망감 활용",
      agentView: "시장의 부정적 인식과 달리 기술적 진보 지속, 반전 가능성",
      alertPrice: 0.5
    }
  ]
};

async function createAgentPatternsAndWatchlist() {
  console.log('🚀 Adding patterns and watchlist to existing agents...');

  try {
    // Get all existing agents
    const agents = await prisma.agent.findMany();
    
    if (agents.length === 0) {
      console.log('❌ No agents found. Please create agents first.');
      return;
    }

    for (const agent of agents) {
      console.log(`\n📝 Processing agent: ${agent.name} (${agent.personality})`);
      
      // Get patterns for this personality type
      const patterns = patternData[agent.personality as keyof typeof patternData];
      const watchlist = watchlistData[agent.personality as keyof typeof watchlistData];
      
      if (patterns) {
        for (const patternInfo of patterns) {
          // Check if pattern already exists
          const existingPattern = await prisma.pattern.findFirst({
            where: {
              agentId: agent.id,
              name: patternInfo.name
            }
          });
          
          if (!existingPattern) {
            await prisma.pattern.create({
              data: {
                agentId: agent.id,
                name: patternInfo.name,
                description: patternInfo.description,
                priority: patternInfo.priority,
                confidenceRate: patternInfo.confidenceRate,
                examples: JSON.stringify(patternInfo.examples)
              }
            });
            console.log(`  ✅ Created pattern: ${patternInfo.name}`);
          } else {
            console.log(`  ⚠️  Pattern already exists: ${patternInfo.name}`);
          }
        }
      }
      
      if (watchlist) {
        for (const watchlistInfo of watchlist) {
          // Check if watchlist item already exists
          const existingItem = await prisma.agentWatchlistItem.findFirst({
            where: {
              agentId: agent.id,
              symbol: watchlistInfo.symbol
            }
          });
          
          if (!existingItem) {
            await prisma.agentWatchlistItem.create({
              data: {
                agentId: agent.id,
                symbol: watchlistInfo.symbol,
                name: watchlistInfo.name,
                category: watchlistInfo.category,
                reason: watchlistInfo.reason,
                agentView: watchlistInfo.agentView,
                alertPrice: watchlistInfo.alertPrice
              }
            });
            console.log(`  ✅ Created watchlist item: ${watchlistInfo.symbol}`);
          } else {
            console.log(`  ⚠️  Watchlist item already exists: ${watchlistInfo.symbol}`);
          }
        }
      }
    }

    // Summary
    const totalPatterns = await prisma.pattern.count();
    const totalWatchlistItems = await prisma.agentWatchlistItem.count();
    
    console.log(`\n📊 Summary:`);
    console.log(`  📈 Total patterns: ${totalPatterns}`);
    console.log(`  👀 Total watchlist items: ${totalWatchlistItems}`);
    console.log(`\n🎉 Agent patterns and watchlists created successfully!`);
    
  } catch (error) {
    console.error('❌ Failed to create agent patterns and watchlist:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAgentPatternsAndWatchlist();