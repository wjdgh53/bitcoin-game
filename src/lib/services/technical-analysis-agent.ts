// Technical Analysis AI Agent Service

import { TechnicalIndicatorData, analyzeTrend } from '@/lib/utils/technical-indicators';

export interface TechnicalAnalysisResult {
  overallTrend: 'bullish' | 'bearish' | 'neutral' | 'sideways';
  trendStrength: number;
  confidence: number;
  buySignals: number;
  sellSignals: number;
  neutralSignals: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  keySupport: number | null;
  keyResistance: number | null;
  nextTarget: number | null;
  stopLoss: number | null;
  summary: string;
  aiInsights: string;
  riskAssessment: string;
  signalStrength: number;
  volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export class TechnicalAnalysisAgent {
  name = "기술분석 전문가 김";
  type = "technical_analyst";
  personality = "모든 기술지표를 종합하여 객관적이고 논리적인 분석을 제공하는 전문가";

  /**
   * Generate comprehensive technical analysis report
   */
  async generateAnalysis(indicators: TechnicalIndicatorData): Promise<TechnicalAnalysisResult> {
    // Base trend analysis
    const trendAnalysis = analyzeTrend(indicators);
    
    // Count signals
    const signals = this.countSignals(indicators);
    
    // Determine recommendation
    const recommendation = this.determineRecommendation(
      trendAnalysis, 
      signals, 
      indicators
    );
    
    // Calculate key levels
    const levels = this.calculateKeyLevels(indicators);
    
    // Assess volatility
    const volatilityLevel = this.assessVolatility(indicators);
    
    // Generate AI insights
    const summary = this.generateSummary(trendAnalysis, signals, indicators);
    const aiInsights = this.generateInsights(indicators, trendAnalysis);
    const riskAssessment = this.generateRiskAssessment(indicators, volatilityLevel);
    
    return {
      ...trendAnalysis,
      ...signals,
      recommendation,
      ...levels,
      summary,
      aiInsights,
      riskAssessment,
      signalStrength: this.calculateSignalStrength(signals, trendAnalysis),
      volatilityLevel,
    };
  }

  /**
   * Count buy/sell/neutral signals from various indicators
   */
  private countSignals(indicators: TechnicalIndicatorData): {
    buySignals: number;
    sellSignals: number;
    neutralSignals: number;
  } {
    let buySignals = 0;
    let sellSignals = 0;
    let neutralSignals = 0;

    const { price, sma5, sma10, sma20, sma50, rsi, macd, macdSignal, bbUpper, bbLower } = indicators;

    // Moving Average Signals
    if (sma5 && sma10) {
      if (sma5 > sma10) buySignals++; else sellSignals++;
    }
    if (sma10 && sma20) {
      if (sma10 > sma20) buySignals++; else sellSignals++;
    }
    if (sma20 && sma50) {
      if (sma20 > sma50) buySignals++; else sellSignals++;
    }

    // Price vs Moving Average
    if (sma20) {
      if (price > sma20) buySignals++; else sellSignals++;
    }

    // RSI Signals
    if (rsi) {
      if (rsi < 30) buySignals++; // Oversold - buy signal
      else if (rsi > 70) sellSignals++; // Overbought - sell signal
      else if (rsi >= 40 && rsi <= 60) neutralSignals++;
      else if (rsi > 50) buySignals++;
      else sellSignals++;
    }

    // MACD Signals
    if (macd && macdSignal) {
      if (macd > macdSignal) buySignals++; else sellSignals++;
    }

    // Bollinger Bands
    if (bbUpper && bbLower) {
      const bbPosition = (price - bbLower) / (bbUpper - bbLower);
      if (bbPosition < 0.2) buySignals++; // Near lower band - oversold
      else if (bbPosition > 0.8) sellSignals++; // Near upper band - overbought
      else neutralSignals++;
    }

    // Stochastic
    if (indicators.stochK && indicators.stochD) {
      if (indicators.stochK < 20 && indicators.stochD < 20) buySignals++; // Oversold
      else if (indicators.stochK > 80 && indicators.stochD > 80) sellSignals++; // Overbought
      else neutralSignals++;
    }

    return { buySignals, sellSignals, neutralSignals };
  }

  /**
   * Determine overall recommendation based on signals and trend
   */
  private determineRecommendation(
    trendAnalysis: ReturnType<typeof analyzeTrend>,
    signals: { buySignals: number; sellSignals: number; neutralSignals: number },
    indicators: TechnicalIndicatorData
  ): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' {
    const { overallTrend, confidence } = trendAnalysis;
    const { buySignals, sellSignals } = signals;
    
    const totalSignals = buySignals + sellSignals;
    const bullishRatio = totalSignals > 0 ? buySignals / totalSignals : 0.5;
    
    // Strong signals require high confidence and clear trend
    if (confidence > 70 && overallTrend === 'bullish' && bullishRatio > 0.75) {
      return 'strong_buy';
    }
    if (confidence > 70 && overallTrend === 'bearish' && bullishRatio < 0.25) {
      return 'strong_sell';
    }
    
    // Regular signals
    if (overallTrend === 'bullish' && bullishRatio > 0.6) {
      return 'buy';
    }
    if (overallTrend === 'bearish' && bullishRatio < 0.4) {
      return 'sell';
    }
    
    // Check for extreme RSI conditions
    if (indicators.rsi) {
      if (indicators.rsi < 25 && overallTrend !== 'bearish') return 'buy';
      if (indicators.rsi > 75 && overallTrend !== 'bullish') return 'sell';
    }
    
    return 'hold';
  }

  /**
   * Calculate key support and resistance levels
   */
  private calculateKeyLevels(indicators: TechnicalIndicatorData): {
    keySupport: number | null;
    keyResistance: number | null;
    nextTarget: number | null;
    stopLoss: number | null;
  } {
    const { price, support, resistance, sma20, bbUpper, bbLower } = indicators;
    
    // Use calculated support/resistance or fallback to MA/BB levels
    const keySupport = support || bbLower || (sma20 ? sma20 * 0.97 : null);
    const keyResistance = resistance || bbUpper || (sma20 ? sma20 * 1.03 : null);
    
    // Calculate next target based on trend
    let nextTarget: number | null = null;
    if (keyResistance && price < keyResistance) {
      nextTarget = keyResistance * 1.02; // 2% above resistance
    } else if (keySupport && price > keySupport) {
      nextTarget = price * 1.05; // 5% above current price
    }
    
    // Calculate stop loss
    let stopLoss: number | null = null;
    if (keySupport) {
      stopLoss = keySupport * 0.98; // 2% below support
    } else {
      stopLoss = price * 0.95; // 5% below current price
    }
    
    return { keySupport, keyResistance, nextTarget, stopLoss };
  }

  /**
   * Assess market volatility level
   */
  private assessVolatility(indicators: TechnicalIndicatorData): 'low' | 'medium' | 'high' | 'extreme' {
    const { bbWidth, rsi } = indicators;
    
    let volatilityScore = 0;
    
    // Bollinger Band Width (normalized)
    if (bbWidth) {
      const normalizedBBWidth = bbWidth / indicators.price;
      if (normalizedBBWidth > 0.1) volatilityScore += 2;
      else if (normalizedBBWidth > 0.05) volatilityScore += 1;
    }
    
    // RSI volatility
    if (rsi) {
      if (rsi > 80 || rsi < 20) volatilityScore += 2;
      else if (rsi > 70 || rsi < 30) volatilityScore += 1;
    }
    
    // MACD histogram (simplified)
    if (indicators.macdHistogram) {
      const histogramAbs = Math.abs(indicators.macdHistogram);
      if (histogramAbs > 500) volatilityScore += 1;
    }
    
    if (volatilityScore >= 4) return 'extreme';
    if (volatilityScore >= 3) return 'high';
    if (volatilityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate overall signal strength
   */
  private calculateSignalStrength(
    signals: { buySignals: number; sellSignals: number; neutralSignals: number },
    trendAnalysis: ReturnType<typeof analyzeTrend>
  ): number {
    const { buySignals, sellSignals, neutralSignals } = signals;
    const totalSignals = buySignals + sellSignals + neutralSignals;
    
    if (totalSignals === 0) return 0;
    
    const signalClarity = Math.abs(buySignals - sellSignals) / totalSignals;
    const confidenceFactor = trendAnalysis.confidence / 100;
    
    return Math.round(signalClarity * confidenceFactor * 100);
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    trendAnalysis: ReturnType<typeof analyzeTrend>,
    signals: { buySignals: number; sellSignals: number; neutralSignals: number },
    indicators: TechnicalIndicatorData
  ): string {
    const { overallTrend, confidence } = trendAnalysis;
    const { buySignals, sellSignals } = signals;
    const { rsi } = indicators;
    
    let summary = `현재 비트코인은 ${this.getTrendKorean(overallTrend)} 추세를 보이고 있습니다.`;
    
    summary += ` 기술적 지표 중 ${buySignals}개가 매수 신호, ${sellSignals}개가 매도 신호를 나타내고 있습니다.`;
    
    if (rsi) {
      if (rsi > 70) {
        summary += ` RSI(${rsi.toFixed(1)})는 과매수 구간으로 단기 조정 가능성이 있습니다.`;
      } else if (rsi < 30) {
        summary += ` RSI(${rsi.toFixed(1)})는 과매도 구간으로 반등 가능성이 높습니다.`;
      } else {
        summary += ` RSI(${rsi.toFixed(1)})는 중립적인 수준을 유지하고 있습니다.`;
      }
    }
    
    summary += ` 현재 분석의 신뢰도는 ${confidence.toFixed(1)}%입니다.`;
    
    return summary;
  }

  /**
   * Generate detailed AI insights
   */
  private generateInsights(
    indicators: TechnicalIndicatorData,
    trendAnalysis: ReturnType<typeof analyzeTrend>
  ): string {
    const insights: string[] = [];
    
    const { price, sma20, sma50, macd, macdSignal, bbUpper, bbLower } = indicators;
    
    // Moving Average Analysis
    if (sma20 && sma50) {
      if (sma20 > sma50) {
        insights.push("20일 이평선이 50일 이평선 위에 위치하여 중기적 상승 모멘텀을 보입니다.");
      } else {
        insights.push("20일 이평선이 50일 이평선 아래에 위치하여 중기적 하락 압력이 있습니다.");
      }
    }
    
    // MACD Analysis
    if (macd && macdSignal) {
      if (macd > macdSignal) {
        insights.push("MACD가 시그널선 위에 위치하여 상승 모멘텀이 강화되고 있습니다.");
      } else {
        insights.push("MACD가 시그널선 아래에 위치하여 하락 모멘텀이 지속되고 있습니다.");
      }
    }
    
    // Bollinger Bands Analysis
    if (bbUpper && bbLower) {
      const bbPosition = (price - bbLower) / (bbUpper - bbLower);
      if (bbPosition > 0.8) {
        insights.push("볼린저 밴드 상단 근처에 위치하여 단기적으로 과열 상태입니다.");
      } else if (bbPosition < 0.2) {
        insights.push("볼린저 밴드 하단 근처에 위치하여 과매도 상태로 반등 가능성이 있습니다.");
      } else if (bbPosition >= 0.4 && bbPosition <= 0.6) {
        insights.push("볼린저 밴드 중앙 근처에서 안정적인 움직임을 보이고 있습니다.");
      }
    }
    
    // Trend Strength Analysis
    if (trendAnalysis.trendStrength > 80) {
      insights.push("매우 강한 추세를 보이고 있어 추세 지속 가능성이 높습니다.");
    } else if (trendAnalysis.trendStrength < 40) {
      insights.push("추세 강도가 약해 방향성 확인이 필요합니다.");
    }
    
    if (insights.length === 0) {
      insights.push("현재 기술적 지표들이 중립적인 신호를 보이고 있어 추가적인 모니터링이 필요합니다.");
    }
    
    return insights.join(" ");
  }

  /**
   * Generate risk assessment
   */
  private generateRiskAssessment(
    indicators: TechnicalIndicatorData,
    volatilityLevel: 'low' | 'medium' | 'high' | 'extreme'
  ): string {
    const risks: string[] = [];
    
    // Volatility-based risk
    switch (volatilityLevel) {
      case 'extreme':
        risks.push("극도로 높은 변동성으로 인해 매우 높은 리스크가 예상됩니다.");
        break;
      case 'high':
        risks.push("높은 변동성으로 인해 단기적 급등락 위험이 있습니다.");
        break;
      case 'medium':
        risks.push("보통 수준의 변동성으로 일반적인 리스크 관리가 필요합니다.");
        break;
      case 'low':
        risks.push("낮은 변동성으로 상대적으로 안정적인 구간입니다.");
        break;
    }
    
    // RSI-based risk
    if (indicators.rsi) {
      if (indicators.rsi > 80) {
        risks.push("극과매수 상태로 급락 위험이 높습니다.");
      } else if (indicators.rsi < 20) {
        risks.push("극과매도 상태이지만 추가 하락 가능성도 있어 주의가 필요합니다.");
      }
    }
    
    // Support/Resistance risk
    if (indicators.support && indicators.resistance) {
      const range = indicators.resistance - indicators.support;
      const currentPosition = (indicators.price - indicators.support) / range;
      
      if (currentPosition > 0.9) {
        risks.push("저항선 근처에서 반락 위험이 높습니다.");
      } else if (currentPosition < 0.1) {
        risks.push("지지선 근처에서 추가 하락 시 손실 확대 가능성이 있습니다.");
      }
    }
    
    return risks.join(" ");
  }

  /**
   * Convert trend to Korean
   */
  private getTrendKorean(trend: string): string {
    switch (trend) {
      case 'bullish': return '상승';
      case 'bearish': return '하락';
      case 'sideways': return '횡보';
      case 'neutral': return '중립';
      default: return '불명확한';
    }
  }
}

// Export singleton instance
export const technicalAnalysisAgent = new TechnicalAnalysisAgent();