// Dynamic AI Agent Service - generates reports based on database agents
import { PrismaClient } from '@prisma/client';
import { bitcoinPriceService } from './bitcoin-price-service';
import { AnalysisReport } from './ai-agents';

const prisma = new PrismaClient();

interface AgentData {
  id: string;
  name: string;
  type: string;
  personality: string;
  strategy: string;
  description: string;
}

export class DynamicAgentService {
  private calculateTechnicalIndicators(prices: number[]) {
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

  private parseStrategies(strategyJson: string): string[] {
    try {
      const strategies = JSON.parse(strategyJson);
      return Array.isArray(strategies) ? strategies : [strategyJson];
    } catch {
      // For backward compatibility with non-JSON strategy strings
      // Split common phrases and return as array
      if (strategyJson.includes('과')) {
        return strategyJson.split(/과|,|\n/).map(s => s.trim()).filter(s => s.length > 0);
      }
      return [strategyJson];
    }
  }

  private mapPersonalityToType(personality: string): string {
    // Handle both enum values and full text descriptions
    const personalityMappings: Record<string, string> = {
      'conservative': 'conservative',
      'aggressive': 'aggressive', 
      'balanced': 'balanced',
      'quantitative': 'quantitative',
      'contrarian': 'contrarian',
      '신중하고 보수적인 가치투자자': 'conservative',
      '적극적이고 빠른 결정을 내리는 모멘텀 트레이더': 'aggressive',
      '데이터와 수학적 모델을 기반으로 하는 분석가': 'quantitative'
    };

    return personalityMappings[personality] || 'balanced';
  }

  private generatePersonalityBasedAnalysis(personality: string, strategies: string[], data: any) {
    const { currentPrice, priceChange24h, indicators, portfolio } = data;
    const personalityType = this.mapPersonalityToType(personality);

    switch (personalityType) {
      case 'conservative':
        return this.generateConservativeAnalysis(strategies, data);
      case 'aggressive':
        return this.generateAggressiveAnalysis(strategies, data);
      case 'balanced':
        return this.generateBalancedAnalysis(strategies, data);
      case 'quantitative':
        return this.generateQuantitativeAnalysis(strategies, data);
      case 'contrarian':
        return this.generateContrarianAnalysis(strategies, data);
      default:
        return this.generateBalancedAnalysis(strategies, data);
    }
  }

  private generateConservativeAnalysis(strategies: string[], data: any) {
    const { currentPrice, priceChange24h, indicators, portfolio } = data;
    
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 50;

    // Conservative approach - only act on significant moves
    if (priceChange24h < -8 && portfolio.balance > 1000) {
      recommendation = 'buy';
      confidence = 75;
    } else if (portfolio.profitPercentage > 20) {
      recommendation = 'sell';
      confidence = 70;
    }

    return {
      recommendation,
      confidence,
      analysis: `보수적 관점에서 현재 시장은 ${priceChange24h > 0 ? '상승' : '하락'} 국면에 있으나, 장기적 안정성을 우선시합니다. ${strategies.includes('장기 보유') ? '장기 보유 전략에 따라' : '리스크 관리 차원에서'} 신중한 접근이 필요합니다.`,
      strategy_focus: strategies.filter(s => ['가치 투자', '장기 보유', 'DCA (분할매수)', '리스크 관리'].includes(s)).join(', ')
    };
  }

  private generateAggressiveAnalysis(strategies: string[], data: any) {
    const { currentPrice, priceChange24h, indicators, portfolio } = data;
    
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 60;

    // Aggressive approach - act on smaller moves
    if (priceChange24h > 2 && indicators.momentum > 0.5) {
      recommendation = 'buy';
      confidence = 85;
    } else if (priceChange24h < -2 && indicators.momentum < -0.5) {
      recommendation = 'sell';
      confidence = 80;
    } else if (Math.abs(priceChange24h) > 1) {
      recommendation = priceChange24h > 0 ? 'buy' : 'sell';
      confidence = 70;
    }

    return {
      recommendation,
      confidence,
      analysis: `공격적 투자 성향에 따라 ${Math.abs(priceChange24h) > 3 ? '강한' : '적당한'} 모멘텀을 감지했습니다. ${strategies.includes('모멘텀 트레이딩') ? '모멘텀 트레이딩 전략으로' : '공격적 매매 전략으로'} 빠른 대응이 필요합니다.`,
      strategy_focus: strategies.filter(s => ['모멘텀 트레이딩', '단기 매매', '데이 트레이딩', '스캘핑'].includes(s)).join(', ')
    };
  }

  private generateBalancedAnalysis(strategies: string[], data: any) {
    const { currentPrice, priceChange24h, indicators, portfolio } = data;
    
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 65;

    // Balanced approach
    if (priceChange24h < -5 && indicators.momentum < -1 && portfolio.balance > 500) {
      recommendation = 'buy';
      confidence = 75;
    } else if (priceChange24h > 5 && portfolio.profitPercentage > 10) {
      recommendation = 'sell';
      confidence = 75;
    } else if (priceChange24h > 3) {
      recommendation = 'buy';
      confidence = 65;
    } else if (priceChange24h < -3) {
      recommendation = 'sell';
      confidence = 65;
    }

    return {
      recommendation,
      confidence,
      analysis: `균형잡힌 접근으로 리스크와 수익의 조화를 추구합니다. ${strategies.includes('포트폴리오 다변화') ? '포트폴리오 다변화를 통해' : '균형잡힌 전략으로'} 안정적인 수익을 목표로 합니다.`,
      strategy_focus: strategies.filter(s => ['스윙 트레이딩', '기술적 분석', '포트폴리오 다변화'].includes(s)).join(', ')
    };
  }

  private generateQuantitativeAnalysis(strategies: string[], data: any) {
    const { currentPrice, priceChange24h, indicators, portfolio } = data;
    
    // More sophisticated quantitative analysis
    const volatility = this.calculateVolatility(data.prices);
    const zScore = this.calculateZScore(currentPrice.price, data.prices);
    
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 70;

    if (zScore < -1.2) {
      recommendation = 'buy';
      confidence = 80;
    } else if (zScore > 1.2 && portfolio.profitPercentage > 8) {
      recommendation = 'sell';
      confidence = 78;
    }

    return {
      recommendation,
      confidence,
      analysis: `정량적 모델 기준 Z-Score ${zScore.toFixed(2)}, 변동성 ${volatility.toFixed(2)}%로 ${Math.abs(zScore) > 1 ? '통계적 이상치' : '정상 범위'} 감지. ${strategies.includes('펀더멘털 분석') ? '펀더멘털과 결합한' : '순수 수학적'} 접근을 적용합니다.`,
      strategy_focus: strategies.filter(s => ['펀더멘털 분석', '기술적 분석', '차익거래'].includes(s)).join(', ')
    };
  }

  private generateContrarianAnalysis(strategies: string[], data: any) {
    const { currentPrice, priceChange24h, indicators, portfolio } = data;
    
    let recommendation: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 60;

    // Contrarian approach - do opposite of market sentiment
    if (priceChange24h > 5) {
      recommendation = 'sell';
      confidence = 75;
    } else if (priceChange24h < -5) {
      recommendation = 'buy';
      confidence = 75;
    } else if (indicators.momentum > 2) {
      recommendation = 'sell';
      confidence = 70;
    } else if (indicators.momentum < -2) {
      recommendation = 'buy';
      confidence = 70;
    }

    return {
      recommendation,
      confidence,
      analysis: `역발상 투자 철학에 따라 시장과 반대 방향으로 접근합니다. ${Math.abs(priceChange24h) > 3 ? '과도한 시장 반응으로 판단하여' : '시장 균형 상태로 보아'} 반대 포지션을 고려합니다.`,
      strategy_focus: strategies.filter(s => ['가치 투자', '매수 타이밍 중시', '매도 타이밍 중시'].includes(s)).join(', ')
    };
  }

  private calculateVolatility(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(365) * 100;
  }

  private calculateZScore(currentPrice: number, prices: number[]): number {
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    return (currentPrice - mean) / stdDev;
  }

  async generateReport(agentType: string): Promise<AnalysisReport> {
    // Get agent data from database
    const agent = await prisma.agent.findUnique({
      where: { type: agentType }
    });

    if (!agent) {
      throw new Error(`Agent with type ${agentType} not found`);
    }

    // Get market data
    const currentPrice = await bitcoinPriceService.getLatestPrice();
    const priceHistory = await bitcoinPriceService.getPriceHistory(24);
    const portfolio = await bitcoinPriceService.getDemoPortfolio();

    if (!currentPrice || !portfolio) {
      throw new Error('시장 데이터를 가져올 수 없습니다');
    }

    const prices = priceHistory.map(h => h.price);
    const priceChange24h = ((currentPrice.price - prices[0]) / prices[0]) * 100;
    const indicators = this.calculateTechnicalIndicators(prices);
    const strategies = this.parseStrategies(agent.strategy);

    const analysisData = {
      currentPrice,
      priceChange24h,
      indicators,
      portfolio,
      prices
    };

    const personalityAnalysis = this.generatePersonalityBasedAnalysis(
      agent.personality,
      strategies,
      analysisData
    );

    // Generate comprehensive report
    return {
      id: `report_${Date.now()}_${agentType}`,
      agentName: agent.name,
      agentType: agent.type,
      timestamp: new Date().toISOString(),
      recommendation: personalityAnalysis.recommendation,
      confidence: personalityAnalysis.confidence,
      title: `${agent.name}의 ${agent.description} 분석 리포트`,
      executive_summary: `${agent.name}(${agent.description})가 분석한 현재 비트코인 시장 상황입니다. 가격 $${currentPrice.price.toLocaleString()}, 24시간 변동률 ${priceChange24h.toFixed(2)}%를 기준으로 ${personalityAnalysis.recommendation === 'buy' ? '매수' : personalityAnalysis.recommendation === 'sell' ? '매도' : '관망'} 추천 (신뢰도: ${personalityAnalysis.confidence}%)`,
      market_analysis: `현재 시장 상황을 ${agent.personality} 성향으로 분석한 결과, ${personalityAnalysis.analysis} 주요 적용 전략: ${personalityAnalysis.strategy_focus || '종합적 접근'}`,
      technical_analysis: `기술적 지표 분석: 5일 평균 $${indicators.sma5.toFixed(0)}, 10일 평균 $${indicators.sma10.toFixed(0)}, 모멘텀 ${indicators.momentum.toFixed(2)}%. 지지선 $${indicators.support.toFixed(0)}, 저항선 $${indicators.resistance.toFixed(0)}. ${strategies.includes('기술적 분석') ? '기술적 분석 전략에 따라 ' + (indicators.sma5 > indicators.sma10 ? '상승 신호' : '하락 신호') + '로 해석됩니다.' : ''}`,
      risk_assessment: `${agent.personality} 성향의 리스크 관리: 현재 포트폴리오 수익률 ${portfolio.profitPercentage.toFixed(2)}%, 현금 비율 ${((portfolio.balance / portfolio.totalValue) * 100).toFixed(1)}%. ${strategies.includes('리스크 관리') ? '리스크 관리 전략을 우선시하여' : ''} ${personalityAnalysis.recommendation === 'hold' ? '안전한 관망' : personalityAnalysis.recommendation === 'buy' ? '신중한 매수' : '적절한 매도'} 접근을 권장합니다.`,
      strategy_rationale: `${agent.name}의 투자 철학은 ${agent.personality} 성향을 바탕으로 ${strategies.slice(0, 3).join(', ')} 전략을 중심으로 합니다. ${personalityAnalysis.recommendation === 'buy' ? '현재 상황은 매수 기회로 판단됩니다' : personalityAnalysis.recommendation === 'sell' ? '수익 실현 또는 리스크 회피 시점으로 보입니다' : '추가 관찰이 필요한 상황입니다'}.`,
      next_steps: `향후 계획: ${personalityAnalysis.recommendation === 'buy' ? strategies.includes('DCA (분할매수)') ? '분할 매수를 통한 점진적 진입' : '적절한 시점에 매수 진행' : personalityAnalysis.recommendation === 'sell' ? strategies.includes('매도 타이밍 중시') ? '최적 매도 타이밍 포착' : '단계적 매도 진행' : '시장 동향 면밀 관찰'}을 통해 ${agent.personality} 투자 원칙을 유지하겠습니다.`,
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

export const dynamicAgentService = new DynamicAgentService();