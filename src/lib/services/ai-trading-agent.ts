// AI Trading Agent Service

import { bitcoinPriceService } from './bitcoin-price-service';

export interface TradingDecision {
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  confidence: number; // 0-100
  reasoning: string;
  analysis: {
    priceChange24h: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    momentum: number;
    support: number;
    resistance: number;
  };
}

export class AITradingAgent {
  private maxTradeAmount = 0.01; // 최대 거래량 (BTC)
  private minConfidence = 60; // 최소 신뢰도

  /**
   * 현재 시장 상황을 분석하고 거래 결정을 내림
   */
  async analyzeAndDecide(): Promise<TradingDecision> {
    try {
      // 현재 가격과 히스토리 데이터 가져오기
      const currentPrice = await bitcoinPriceService.getLatestPrice();
      const priceHistory = await bitcoinPriceService.getPriceHistory(24); // 24시간
      const portfolio = await bitcoinPriceService.getDemoPortfolio();

      if (!currentPrice || !portfolio || priceHistory.length < 5) {
        return {
          action: 'hold',
          amount: 0,
          confidence: 0,
          reasoning: '데이터 부족으로 거래 보류',
          analysis: {
            priceChange24h: 0,
            trend: 'neutral',
            momentum: 0,
            support: 0,
            resistance: 0
          }
        };
      }

      // 기술적 분석 수행
      const analysis = this.performTechnicalAnalysis(currentPrice, priceHistory);
      
      // 포트폴리오 상황 분석
      const portfolioAnalysis = this.analyzePortfolio(portfolio, currentPrice);

      // AI 거래 결정 로직
      const decision = this.makeDecision(analysis, portfolioAnalysis, currentPrice, portfolio);

      return decision;

    } catch (error) {
      console.error('AI Trading Agent error:', error);
      return {
        action: 'hold',
        amount: 0,
        confidence: 0,
        reasoning: '시스템 오류로 거래 보류',
        analysis: {
          priceChange24h: 0,
          trend: 'neutral',
          momentum: 0,
          support: 0,
          resistance: 0
        }
      };
    }
  }

  /**
   * 기술적 분석 수행
   */
  private performTechnicalAnalysis(currentPrice: any, history: any[]) {
    const prices = history.map(h => h.price);
    const currentPriceValue = currentPrice.price;

    // 24시간 변동률
    const oldestPrice = prices[0];
    const priceChange24h = ((currentPriceValue - oldestPrice) / oldestPrice) * 100;

    // 단순 이동평균 (SMA)
    const sma5 = this.calculateSMA(prices.slice(-5));
    const sma10 = this.calculateSMA(prices.slice(-10));

    // 모멘텀 계산
    const momentum = this.calculateMomentum(prices);

    // 지지선/저항선 계산
    const support = Math.min(...prices.slice(-10));
    const resistance = Math.max(...prices.slice(-10));

    // 트렌드 판단
    let trend: 'bullish' | 'bearish' | 'neutral';
    if (currentPriceValue > sma5 && sma5 > sma10 && priceChange24h > 1) {
      trend = 'bullish';
    } else if (currentPriceValue < sma5 && sma5 < sma10 && priceChange24h < -1) {
      trend = 'bearish';
    } else {
      trend = 'neutral';
    }

    return {
      priceChange24h,
      trend,
      momentum,
      support,
      resistance,
      sma5,
      sma10,
      currentPrice: currentPriceValue
    };
  }

  /**
   * 포트폴리오 분석
   */
  private analyzePortfolio(portfolio: any, currentPrice: any) {
    const totalValue = portfolio.totalValue;
    const cashRatio = portfolio.balance / totalValue;
    const btcRatio = (portfolio.bitcoinHoldings * currentPrice.price) / totalValue;

    return {
      totalValue,
      cashRatio,
      btcRatio,
      hasEnoughCash: portfolio.balance > 100, // 최소 $100
      hasEnoughBTC: portfolio.bitcoinHoldings > 0.001 // 최소 0.001 BTC
    };
  }

  /**
   * AI 거래 결정 로직
   */
  private makeDecision(analysis: any, portfolioAnalysis: any, currentPrice: any, portfolio: any): TradingDecision {
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let amount = 0;
    let confidence = 50;
    let reasoning = '';

    const { trend, priceChange24h, momentum, currentPrice: price } = analysis;
    const { cashRatio, btcRatio, hasEnoughCash, hasEnoughBTC } = portfolioAnalysis;

    // 매수 신호 분석
    if (trend === 'bullish' && momentum > 0 && priceChange24h > 2 && cashRatio > 0.3) {
      if (hasEnoughCash) {
        action = 'buy';
        amount = Math.min(this.maxTradeAmount, portfolio.balance / price * 0.1); // 현금의 10%
        confidence = Math.min(85, 60 + Math.abs(priceChange24h) * 2);
        reasoning = `상승 트렌드 감지: 24h +${priceChange24h.toFixed(2)}%, 강한 모멘텀 ${momentum.toFixed(2)}`;
      }
    }
    // 강한 매수 신호
    else if (priceChange24h > 5 && momentum > 1.5 && hasEnoughCash) {
      action = 'buy';
      amount = Math.min(this.maxTradeAmount, portfolio.balance / price * 0.15); // 현금의 15%
      confidence = Math.min(95, 70 + Math.abs(priceChange24h));
      reasoning = `강력한 상승 신호: 24h +${priceChange24h.toFixed(2)}%, 매우 강한 모멘텀`;
    }
    // 매도 신호 분석
    else if (trend === 'bearish' && momentum < 0 && priceChange24h < -2 && btcRatio > 0.3) {
      if (hasEnoughBTC) {
        action = 'sell';
        amount = Math.min(portfolio.bitcoinHoldings * 0.2, this.maxTradeAmount); // BTC의 20%
        confidence = Math.min(85, 60 + Math.abs(priceChange24h) * 2);
        reasoning = `하락 트렌드 감지: 24h ${priceChange24h.toFixed(2)}%, 약한 모멘텀 ${momentum.toFixed(2)}`;
      }
    }
    // 강한 매도 신호
    else if (priceChange24h < -5 && momentum < -1.5 && hasEnoughBTC) {
      action = 'sell';
      amount = Math.min(portfolio.bitcoinHoldings * 0.3, this.maxTradeAmount); // BTC의 30%
      confidence = Math.min(95, 70 + Math.abs(priceChange24h));
      reasoning = `강력한 하락 신호: 24h ${priceChange24h.toFixed(2)}%, 매우 약한 모멘텀`;
    }
    // 수익실현 매도
    else if (portfolio.profitPercentage > 5 && btcRatio > 0.7) {
      action = 'sell';
      amount = Math.min(portfolio.bitcoinHoldings * 0.1, this.maxTradeAmount); // BTC의 10%
      confidence = 75;
      reasoning = `수익실현: 포트폴리오 수익률 +${portfolio.profitPercentage.toFixed(2)}%`;
    }
    // 홀드
    else {
      reasoning = `시장 관망: 24h ${priceChange24h.toFixed(2)}%, 트렌드 ${trend}, 추가 신호 대기`;
    }

    // 신뢰도가 낮으면 홀드
    if (confidence < this.minConfidence && action !== 'hold') {
      action = 'hold';
      reasoning += ` (신뢰도 부족: ${confidence}%)`;
    }

    return {
      action,
      amount: Number(amount.toFixed(6)),
      confidence,
      reasoning,
      analysis: {
        priceChange24h,
        trend,
        momentum,
        support: analysis.support,
        resistance: analysis.resistance
      }
    };
  }

  /**
   * 단순 이동평균 계산
   */
  private calculateSMA(prices: number[]): number {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }

  /**
   * 모멘텀 계산
   */
  private calculateMomentum(prices: number[]): number {
    if (prices.length < 5) return 0;
    
    const recent = prices.slice(-3);
    const previous = prices.slice(-6, -3);
    
    const recentAvg = this.calculateSMA(recent);
    const previousAvg = this.calculateSMA(previous);
    
    return ((recentAvg - previousAvg) / previousAvg) * 100;
  }

  /**
   * 거래 실행
   */
  async executeTradingDecision(decision: TradingDecision): Promise<{ success: boolean; message: string }> {
    if (decision.action === 'hold' || decision.amount <= 0) {
      return {
        success: true,
        message: `AI 결정: ${decision.reasoning}`
      };
    }

    try {
      const result = await bitcoinPriceService.executeTrade(decision.action, decision.amount);
      
      if (result.success) {
        return {
          success: true,
          message: `AI ${decision.action === 'buy' ? '매수' : '매도'}: ${decision.amount} BTC (신뢰도: ${decision.confidence}%) - ${decision.reasoning}`
        };
      } else {
        return {
          success: false,
          message: `AI 거래 실패: ${result.message}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `AI 거래 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const aiTradingAgent = new AITradingAgent();