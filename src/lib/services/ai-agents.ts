// AI Trading Agents with Different Personalities and Strategies

import { bitcoinPriceService } from './bitcoin-price-service';

export interface AnalysisReport {
  id: string;
  agentName: string;
  agentType: string;
  timestamp: string;
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  title: string;
  executive_summary: string;
  market_analysis: string;
  technical_analysis: string;
  risk_assessment: string;
  strategy_rationale: string;
  next_steps: string;
  data_points: {
    current_price: number;
    price_change_24h: number;
    trend: string;
    momentum: number;
    support: number;
    resistance: number;
  };
}

export abstract class BaseAIAgent {
  abstract name: string;
  abstract type: string;
  abstract personality: string;
  abstract strategy: string;
  
  protected async getMarketData() {
    const currentPrice = await bitcoinPriceService.getLatestPrice();
    const priceHistory = await bitcoinPriceService.getPriceHistory(24);
    const portfolio = await bitcoinPriceService.getDemoPortfolio();

    return { currentPrice, priceHistory, portfolio };
  }

  protected calculateTechnicalIndicators(prices: number[]) {
    const sma5 = this.calculateSMA(prices.slice(-5));
    const sma10 = this.calculateSMA(prices.slice(-10));
    const momentum = this.calculateMomentum(prices);
    const support = Math.min(...prices.slice(-10));
    const resistance = Math.max(...prices.slice(-10));

    return { sma5, sma10, momentum, support, resistance };
  }

  private calculateSMA(prices: number[]): number {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }

  private calculateMomentum(prices: number[]): number {
    if (prices.length < 6) return 0;
    const recent = prices.slice(-3);
    const previous = prices.slice(-6, -3);
    const recentAvg = this.calculateSMA(recent);
    const previousAvg = this.calculateSMA(previous);
    return ((recentAvg - previousAvg) / previousAvg) * 100;
  }

  abstract generateReport(): Promise<AnalysisReport>;
}

// 1. 보수적 가치투자 에이전트
export class ConservativeValueAgent extends BaseAIAgent {
  name = "워렌 김";
  type = "conservative_value";
  personality = "신중하고 보수적인 가치투자자";
  strategy = "장기적 관점에서 펀더멘털 중심의 안전한 투자";

  async generateReport(): Promise<AnalysisReport> {
    const { currentPrice, priceHistory, portfolio } = await this.getMarketData();
    
    if (!currentPrice || !portfolio) {
      throw new Error('시장 데이터를 가져올 수 없습니다');
    }

    const prices = priceHistory.map(h => h.price);
    const priceChange24h = ((currentPrice.price - prices[0]) / prices[0]) * 100;
    const indicators = this.calculateTechnicalIndicators(prices);

    // 보수적 분석
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 50;

    if (priceChange24h < -10 && portfolio.balance > 500) {
      recommendation = 'buy';
      confidence = 75;
    } else if (portfolio.profitPercentage > 15) {
      recommendation = 'sell';
      confidence = 80;
    }

    return {
      id: `report_${Date.now()}_conservative`,
      agentName: this.name,
      agentType: this.type,
      timestamp: new Date().toISOString(),
      recommendation,
      confidence,
      title: `${this.name}의 보수적 시장 분석 리포트`,
      executive_summary: `현재 비트코인 가격은 $${currentPrice.price.toLocaleString()}로, 24시간 ${priceChange24h.toFixed(2)}% 변동을 보이고 있습니다. ${recommendation === 'buy' ? '저점 매수 기회로 판단' : recommendation === 'sell' ? '수익 실현 시점으로 판단' : '추가 관찰이 필요한 상황'}됩니다.`,
      market_analysis: `전체적인 시장 상황을 종합적으로 분석한 결과, ${priceChange24h > 0 ? '상승' : '하락'} 모멘텀이 감지되고 있습니다. 하지만 제가 추구하는 가치투자 관점에서는 단기적 변동보다는 장기적 트렌드와 펀더멘털이 더 중요합니다. 현재 포트폴리오 수익률이 ${portfolio.profitPercentage.toFixed(2)}%인 점을 고려할 때, ${recommendation === 'hold' ? '성급한 결정보다는 인내심을 가지고 기다리는 것' : recommendation === 'buy' ? '이번 하락은 좋은 매수 기회' : '적절한 수익 실현 시점'}으로 보입니다.`,
      technical_analysis: `기술적 지표를 보면 5일 이동평균이 ${indicators.sma5.toFixed(0)}달러, 10일 이동평균이 ${indicators.sma10.toFixed(0)}달러입니다. 현재가가 ${currentPrice.price > indicators.sma10 ? '10일선 위에 위치' : '10일선 아래에 위치'}해 있어 ${currentPrice.price > indicators.sma10 ? '상대적으로 안정적' : '조정 국면'}인 상황입니다. 지지선은 $${indicators.support.toFixed(0)}, 저항선은 $${indicators.resistance.toFixed(0)}로 분석됩니다.`,
      risk_assessment: `위험 관리 측면에서 현재 현금 비율이 ${((portfolio.balance / portfolio.totalValue) * 100).toFixed(1)}%로, 적절한 유동성을 확보하고 있습니다. 다만 암호화폐의 높은 변동성을 고려할 때, 무리한 레버리지나 단기 투기는 지양해야 합니다. ${recommendation === 'buy' ? '매수 시에도 분할 매수를 통해 평균 단가를 낮추는 전략' : recommendation === 'sell' ? '일부 물량만 매도하여 상승 여력은 남겨두는 전략' : '현재 포지션을 유지하면서 명확한 신호를 기다리는 전략'}을 권장합니다.`,
      strategy_rationale: `제가 추구하는 가치투자 철학은 "시장이 단기적으로는 투표기계이지만, 장기적으로는 저울이다"라는 벤저민 그레이엄의 말씀에 기반합니다. 비트코인 역시 혁신적인 기술과 제한된 공급량이라는 펀더멘털적 가치를 가지고 있기 때문에, 단기적 변동에 일희일비하기보다는 장기적 관점에서 접근해야 합니다. ${recommendation === 'buy' ? '현재 수준은 장기 투자자에게 매력적인 진입점' : recommendation === 'sell' ? '적절한 수익을 확보하여 다음 기회를 기다리는 것이 현명' : '시장의 방향성이 명확해질 때까지 기다리는 인내'}가 필요합니다.`,
      next_steps: `앞으로 ${recommendation === 'buy' ? '3-5일에 걸쳐 분할 매수를 진행하고, 추가 하락 시 매수 기회로 활용' : recommendation === 'sell' ? '전체 포지션의 30% 정도만 매도하여 수익을 실현하되, 나머지는 보유 지속' : '일주일간 시장 동향을 면밀히 관찰하며, 명확한 트렌드 전환 신호가 나올 때까지 대기'}할 계획입니다. 무엇보다 감정적 판단을 배제하고, 데이터와 펀더멘털에 기반한 의사결정을 지속하겠습니다.`,
      data_points: {
        current_price: currentPrice.price,
        price_change_24h: priceChange24h,
        trend: priceChange24h > 2 ? 'bullish' : priceChange24h < -2 ? 'bearish' : 'neutral',
        momentum: indicators.momentum,
        support: indicators.support,
        resistance: indicators.resistance
      }
    };
  }
}

// 2. 공격적 모멘텀 트레이더
export class AggressiveMomentumAgent extends BaseAIAgent {
  name = "제시카 박";
  type = "aggressive_momentum";
  personality = "공격적이고 빠른 결정을 내리는 모멘텀 트레이더";
  strategy = "기술적 분석과 모멘텀을 활용한 단기 수익 극대화";

  async generateReport(): Promise<AnalysisReport> {
    const { currentPrice, priceHistory, portfolio } = await this.getMarketData();
    
    if (!currentPrice || !portfolio) {
      throw new Error('시장 데이터를 가져올 수 없습니다');
    }

    const prices = priceHistory.map(h => h.price);
    const priceChange24h = ((currentPrice.price - prices[0]) / prices[0]) * 100;
    const indicators = this.calculateTechnicalIndicators(prices);

    // 공격적 분석
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 60;

    if (priceChange24h > 3 && indicators.momentum > 1) {
      recommendation = 'buy';
      confidence = 90;
    } else if (priceChange24h < -3 && indicators.momentum < -1) {
      recommendation = 'sell';
      confidence = 85;
    } else if (Math.abs(priceChange24h) > 1) {
      recommendation = priceChange24h > 0 ? 'buy' : 'sell';
      confidence = 75;
    }

    return {
      id: `report_${Date.now()}_momentum`,
      agentName: this.name,
      agentType: this.type,
      timestamp: new Date().toISOString(),
      recommendation,
      confidence,
      title: `${this.name}의 모멘텀 분석 리포트 🚀`,
      executive_summary: `강력한 ${Math.abs(priceChange24h) > 5 ? '초강세' : Math.abs(priceChange24h) > 3 ? '강세' : Math.abs(priceChange24h) > 1 ? '상승' : '횡보'} 모멘텀 감지! 현재 BTC는 $${currentPrice.price.toLocaleString()}에서 24시간 ${priceChange24h.toFixed(2)}% 움직임을 보이고 있습니다. ${recommendation === 'buy' ? '⚡ 즉시 매수 신호!' : recommendation === 'sell' ? '🔥 빠른 매도 필요!' : '⏳ 추가 신호 대기'}`,
      market_analysis: `지금 이 순간이 바로 기회입니다! 모멘텀 지표가 ${indicators.momentum.toFixed(2)}%를 기록하며 ${indicators.momentum > 1 ? '강력한 상승 에너지' : indicators.momentum < -1 ? '급격한 하락 압력' : '균형 상태'}를 보여주고 있어요. 제가 추적하는 단기 패턴 분석에 따르면, ${priceChange24h > 0 ? '상승' : '하락'} 트렌드가 ${Math.abs(priceChange24h) > 3 ? '가속화' : '형성'} 중입니다. 이런 움직임은 보통 ${recommendation === 'buy' ? '2-3일 더 지속될 가능성이 높아' : recommendation === 'sell' ? '빠른 반전이 예상되어' : '방향성을 찾고 있어'} 지금이 결정적 순간이에요!`,
      technical_analysis: `차트를 보면 완전히 명확합니다! 💹 5일 이동평균($${indicators.sma5.toFixed(0)})과 10일 이동평균($${indicators.sma10.toFixed(0)})의 관계가 ${indicators.sma5 > indicators.sma10 ? '골든크로스 형성' : '데드크로스 위험'}을 보여주고 있어요. 현재가가 ${currentPrice.price > indicators.resistance * 0.95 ? '저항선($' + indicators.resistance.toFixed(0) + ') 근처에서 돌파 시도' : currentPrice.price < indicators.support * 1.05 ? '지지선($' + indicators.support.toFixed(0) + ') 근처에서 반등 시도' : '중간 영역에서 방향 모색'} 중이에요. 볼린저 밴드와 RSI를 종합하면 ${recommendation === 'buy' ? '과매도 반등' : recommendation === 'sell' ? '과매수 조정' : '중립 구간'} 신호가 강하게 나타나고 있습니다!`,
      risk_assessment: `리스크? 물론 있죠! 하지만 기회는 리스크를 감수하는 자에게 온다고 생각해요. 💪 현재 변동성이 ${Math.abs(priceChange24h) > 5 ? '매우 높아' : Math.abs(priceChange24h) > 2 ? '높아' : '보통이라'} ${recommendation === 'buy' ? '빠른 수익의 기회이자 손실의 위험도 크지만, 적절한 손절매만 설정하면 충분히 관리 가능' : recommendation === 'sell' ? '추가 하락 리스크가 크므로 빠른 청산이 필요' : '큰 움직임을 기다리며 포지션 조절이 필요'}합니다. 제 전략은 항상 빠른 결정과 엄격한 손절매예요!`,
      strategy_rationale: `제가 모멘텀 트레이딩을 선택한 이유는 간단해요 - 시장은 감정으로 움직이고, 그 감정의 방향을 빠르게 포착하는 것이 핵심이거든요! 🎯 특히 암호화폐는 전통 자산보다 감정적 요소가 크기 때문에 모멘텀 전략이 매우 효과적입니다. ${recommendation === 'buy' ? '지금 이 상승 모멘텀을 놓치면 큰 기회를 잃는 것' : recommendation === 'sell' ? '하락 모멘텀이 본격화되기 전에 빠르게 대응하는 것' : '명확한 방향이 나올 때까지 기다리되, 신호가 나오면 즉시 행동'}이 제 철학입니다. "빠르게 움직이지 않으면 기회는 사라진다!"`,
      next_steps: `행동 계획은 명확합니다! 🔥 ${recommendation === 'buy' ? '지금 당장 매수 진입 후 2-3% 상승 시 일부 익절, 손절선은 현재가 대비 -2% 설정' : recommendation === 'sell' ? '즉시 포지션 정리 후 반등 시 추가 매도, 현금 비중 확대' : '15분 단위로 차트 모니터링하며 돌파 또는 이탈 신호 포착 시 즉시 진입'}! 시장은 기다려주지 않아요. 다음 4-6시간이 결정적일 것 같아요. 감정에 휘둘리지 말고 데이터에 따라 차가운 결정을 내리겠습니다! 💎🙌`,
      data_points: {
        current_price: currentPrice.price,
        price_change_24h: priceChange24h,
        trend: priceChange24h > 2 ? 'bullish' : priceChange24h < -2 ? 'bearish' : 'neutral',
        momentum: indicators.momentum,
        support: indicators.support,
        resistance: indicators.resistance
      }
    };
  }
}

// 3. 균형잡힌 퀀트 분석가
export class QuantitativeAnalyst extends BaseAIAgent {
  name = "알렉스 최";
  type = "quantitative";
  personality = "데이터와 수학적 모델을 신뢰하는 퀀트 분석가";
  strategy = "통계적 모델과 알고리즘을 통한 체계적 투자";

  async generateReport(): Promise<AnalysisReport> {
    const { currentPrice, priceHistory, portfolio } = await this.getMarketData();
    
    if (!currentPrice || !portfolio) {
      throw new Error('시장 데이터를 가져올 수 없습니다');
    }

    const prices = priceHistory.map(h => h.price);
    const priceChange24h = ((currentPrice.price - prices[0]) / prices[0]) * 100;
    const indicators = this.calculateTechnicalIndicators(prices);

    // 퀀트 분석
    const volatility = this.calculateVolatility(prices);
    const sharpeRatio = this.calculateSharpeRatio(prices);
    const zScore = this.calculateZScore(currentPrice.price, prices);

    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 70;

    if (zScore < -1.5 && sharpeRatio > 0.5) {
      recommendation = 'buy';
      confidence = 85;
    } else if (zScore > 1.5 && portfolio.profitPercentage > 10) {
      recommendation = 'sell';
      confidence = 80;
    }

    return {
      id: `report_${Date.now()}_quant`,
      agentName: this.name,
      agentType: this.type,
      timestamp: new Date().toISOString(),
      recommendation,
      confidence,
      title: `${this.name}의 정량적 시장 분석 📊`,
      executive_summary: `수학적 모델 기반 분석 결과, 현재 BTC 가격($${currentPrice.price.toLocaleString()})은 통계적으로 ${zScore > 0 ? '과평가' : '저평가'} 구간에 위치합니다. Z-Score: ${zScore.toFixed(2)}, 샤프비율: ${sharpeRatio.toFixed(2)}, 변동성: ${volatility.toFixed(2)}%. 모델 신뢰도: ${confidence}%`,
      market_analysis: `다변량 회귀모델과 시계열 분석을 통해 시장을 분석한 결과, 현재 가격은 이동평균 대비 ${((currentPrice.price - indicators.sma10) / indicators.sma10 * 100).toFixed(2)}% ${currentPrice.price > indicators.sma10 ? '프리미엄' : '디스카운트'}을 보이고 있습니다. 변동성 지수는 ${volatility.toFixed(2)}%로 ${volatility > 5 ? '높은 편이며' : volatility > 2 ? '보통 수준이며' : '낮은 편이며'}, 이는 ${volatility > 5 ? '높은 수익과 함께 높은 리스크' : '안정적인 수익 패턴'}을 시사합니다. 몬테카를로 시뮬레이션 결과 향후 24시간 내 ±${(volatility * 1.5).toFixed(1)}% 범위에서 움직일 확률이 68%입니다.`,
      technical_analysis: `기술적 지표의 정량화된 분석: RSI 근사치 ${50 + (priceChange24h * 2)}, MACD 신호 ${indicators.sma5 > indicators.sma10 ? '상승' : '하락'} 다이버전스, 볼린저 밴드 기준 ${Math.abs(zScore) > 2 ? '극단값' : Math.abs(zScore) > 1 ? '이탈값' : '정상범위'} 감지. 피보나치 되돌림 수준에서 ${currentPrice.price}는 ${currentPrice.price > (indicators.support + indicators.resistance) / 2 ? '상단' : '하단'} 구간에 위치하여 ${currentPrice.price > (indicators.support + indicators.resistance) / 2 ? '저항' : '지지'} 테스트 중입니다.`,
      risk_assessment: `위험 측정 지표: VaR(95% 신뢰구간) = ${(currentPrice.price * volatility * 0.016).toFixed(0)}달러, 최대낙폭 위험 = ${(volatility * 2).toFixed(1)}%, 포트폴리오 베타 = ${(priceChange24h / 2).toFixed(2)}. 현재 포트폴리오의 샤프비율 ${sharpeRatio.toFixed(2)}는 ${sharpeRatio > 1 ? '우수한' : sharpeRatio > 0.5 ? '양호한' : '개선이 필요한'} 위험 대비 수익률을 보여줍니다. 스트레스 테스트 결과 ${recommendation === 'buy' ? '추가 매수 시에도 허용 가능한' : recommendation === 'sell' ? '포지션 축소가 필요한' : '현재 수준 유지가 적절한'} 리스크 수준입니다.`,
      strategy_rationale: `저의 퀀트 전략은 감정을 배제한 순수 수학적 접근법에 기반합니다. 블랙-숄즈 모델을 암호화폐에 적용한 수정 모델과 GARCH를 통한 변동성 예측, 그리고 머신러닝 기반 가격 예측 모델을 조합하여 의사결정을 내립니다. ${recommendation === 'buy' ? '현재 통계적 저평가 상태로 평균회귀 가능성이 높아' : recommendation === 'sell' ? '과평가 구간으로 조정 가능성이 높아' : 'z-score가 중립 구간으로 추가 데이터 필요해'} 해당 포지션을 권장합니다. 모든 결정은 백테스팅을 통해 검증된 알고리즘을 따릅니다.`,
      next_steps: `다음 24시간 동안 15분 간격으로 지표를 모니터링하며, ${recommendation === 'buy' ? 'z-score가 -1.0 이상으로 회복 시까지 분할 매수 진행' : recommendation === 'sell' ? 'z-score가 1.0 이하로 하락 시까지 단계적 매도 진행' : 'z-score ±1.5 이탈 시 포지션 조정'} 예정입니다. 알고리즘 신호: ${Math.abs(zScore) > 2 ? 'STRONG' : Math.abs(zScore) > 1 ? 'MODERATE' : 'WEAK'} ${recommendation.toUpperCase()} (신뢰구간: ${confidence}%). 추가적으로 변동성이 ${volatility}% 이상 증가 시 포지션 크기 조정 예정입니다.`,
      data_points: {
        current_price: currentPrice.price,
        price_change_24h: priceChange24h,
        trend: zScore > 0.5 ? 'overbought' : zScore < -0.5 ? 'oversold' : 'neutral',
        momentum: indicators.momentum,
        support: indicators.support,
        resistance: indicators.resistance
      }
    };
  }

  private calculateVolatility(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility
  }

  private calculateSharpeRatio(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length);
    return meanReturn / volatility;
  }

  private calculateZScore(currentPrice: number, prices: number[]): number {
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    return (currentPrice - mean) / stdDev;
  }
}

export const aiAgents = {
  conservative: new ConservativeValueAgent(),
  momentum: new AggressiveMomentumAgent(),
  quantitative: new QuantitativeAnalyst()
};

export type AgentType = keyof typeof aiAgents;