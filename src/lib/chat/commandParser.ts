// Natural language command parser for agent chat interactions
import { Agent, Pattern, AgentWatchlistItem } from '@/types/game';

export interface ParsedCommand {
  type: 'strategy' | 'pattern' | 'watchlist' | 'info' | 'general';
  action: 'add' | 'remove' | 'update' | 'list' | 'help' | 'none';
  parameters: Record<string, any>;
  confidence: number; // 0-1 confidence score
  originalMessage: string;
}

// Korean language patterns for different commands
const COMMAND_PATTERNS = {
  strategy: [
    /전략.*?(추가|수정|변경|바꿔|업데이트)/i,
    /매매.*?전략/i,
    /투자.*?방법/i,
    /(포트폴리오|자산).*?(조정|리밸런싱)/i
  ],
  pattern: [
    /패턴.*?(추가|생성|만들어|새로)/i,
    /매매.*?패턴/i,
    /거래.*?(규칙|패턴)/i,
    /기술.*?분석.*?패턴/i,
    /지표.*?패턴/i
  ],
  watchlist: [
    /(관심종목|종목|코인).*?(추가|등록|넣어)/i,
    /종목.*?(모니터링|관리|추적)/i,
    /알림.*?(설정|가격)/i,
    /(비트코인|BTC|이더리움|ETH).*?(관심|추가)/i
  ],
  info: [
    /(정보|설명|소개|어떤|뭐야|설정)/i,
    /어떻게.*?(작동|동작|일하)/i,
    /무엇.*?(할 수 있|가능)/i
  ]
};

const ACTION_PATTERNS = {
  add: [/추가|생성|만들어|등록|넣어|새로/i],
  remove: [/제거|삭제|빼|없애/i],
  update: [/수정|변경|바꿔|업데이트|조정/i],
  list: [/목록|리스트|보여|확인|조회/i],
  help: [/도움|도와|방법|어떻게/i]
};

// Extract specific parameters from messages
const PARAMETER_EXTRACTORS = {
  symbol: /\b(BTC|ETH|ADA|SOL|DOGE|LINK|BNB|XRP)\b/gi,
  price: /\$?[\d,]+\.?\d*/g,
  percentage: /\d+%/g,
  timeframe: /(단기|중기|장기|1일|1주|1개월|1년)/gi,
  amount: /[\d,]+\.?\d*\s?(달러|원|USD|KRW)/gi
};

export function parseCommand(message: string, agent: Agent): ParsedCommand {
  const lowerMessage = message.toLowerCase().trim();
  
  // Determine command type
  let commandType: ParsedCommand['type'] = 'general';
  let confidence = 0;

  for (const [type, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        commandType = type as ParsedCommand['type'];
        confidence = Math.max(confidence, 0.8);
        break;
      }
    }
    if (confidence > 0) break;
  }

  // Determine action
  let action: ParsedCommand['action'] = 'none';
  for (const [actionType, patterns] of Object.entries(ACTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        action = actionType as ParsedCommand['action'];
        confidence = Math.max(confidence, 0.7);
        break;
      }
    }
    if (action !== 'none') break;
  }

  // Extract parameters
  const parameters: Record<string, any> = {};
  
  // Extract cryptocurrency symbols
  const symbols = message.match(PARAMETER_EXTRACTORS.symbol);
  if (symbols) {
    parameters.symbols = symbols.map(s => s.toUpperCase());
  }

  // Extract prices
  const prices = message.match(PARAMETER_EXTRACTORS.price);
  if (prices) {
    parameters.prices = prices.map(p => parseFloat(p.replace(/[,$]/g, '')));
  }

  // Extract percentages
  const percentages = message.match(PARAMETER_EXTRACTORS.percentage);
  if (percentages) {
    parameters.percentages = percentages.map(p => parseInt(p.replace('%', '')));
  }

  // Extract timeframes
  const timeframes = message.match(PARAMETER_EXTRACTORS.timeframe);
  if (timeframes) {
    parameters.timeframes = timeframes;
  }

  // Extract amounts
  const amounts = message.match(PARAMETER_EXTRACTORS.amount);
  if (amounts) {
    parameters.amounts = amounts;
  }

  // Context-specific parameter extraction
  if (commandType === 'pattern') {
    // Look for pattern-specific terms
    if (/RSI|볼린저|이동평균|MACD/i.test(message)) {
      parameters.technicalIndicators = message.match(/RSI|볼린저|이동평균|MACD/gi);
    }
    
    if (/보수적|공격적|균형|정량적|역발상/i.test(message)) {
      parameters.personality = message.match(/보수적|공격적|균형|정량적|역발상/gi)?.[0];
    }
  }

  if (commandType === 'strategy') {
    // Look for strategy-specific terms
    if (/DCA|달러.*?평균|분할.*?매수/i.test(message)) {
      parameters.strategyType = 'DCA';
    } else if (/모멘텀|추세/i.test(message)) {
      parameters.strategyType = 'momentum';
    } else if (/가치.*?투자/i.test(message)) {
      parameters.strategyType = 'value';
    }
  }

  if (commandType === 'watchlist') {
    // Look for alert preferences
    if (/알림|경고/i.test(message)) {
      parameters.enableAlerts = true;
      
      if (/상승|위로|넘어서/i.test(message)) {
        parameters.alertType = 'above';
      } else if (/하락|아래|내려가/i.test(message)) {
        parameters.alertType = 'below';
      } else {
        parameters.alertType = 'both';
      }
    }
  }

  // Adjust confidence based on specificity
  if (Object.keys(parameters).length > 0) {
    confidence = Math.min(confidence + 0.2, 1.0);
  }

  // Context from agent's current state
  parameters.agentContext = {
    personality: agent.personality,
    currentPatterns: agent.patterns?.length || 0,
    currentWatchlist: agent.watchlistItems?.length || 0,
    isActive: agent.isActive
  };

  return {
    type: commandType,
    action,
    parameters,
    confidence,
    originalMessage: message
  };
}

// Generate response based on parsed command
export function generateCommandResponse(command: ParsedCommand, agent: Agent): {
  content: string;
  metadata: Record<string, any>;
  requiresConfirmation?: boolean;
} {
  const { type, action, parameters, confidence } = command;

  // Low confidence responses
  if (confidence < 0.3) {
    return {
      content: `${agent.name}: 죄송해요, 요청을 정확히 이해하지 못했습니다. 좀 더 구체적으로 말씀해 주시겠어요? 예를 들어 "BTC 관심종목에 추가해줘" 또는 "매매 전략을 수정해줘" 같이 말씀해 주세요.`,
      metadata: {
        type: 'clarification_needed',
        suggestions: [
          '전략 수정하기',
          '새 패턴 추가하기',
          '관심종목 관리하기'
        ]
      }
    };
  }

  // Strategy commands
  if (type === 'strategy') {
    if (action === 'update' || action === 'add') {
      return {
        content: `${agent.name}: 네, 투자 전략을 ${action === 'update' ? '수정' : '추가'}하겠습니다. ${parameters.strategyType ? `${parameters.strategyType} 전략을 중심으로 ` : ''}어떤 부분을 조정하고 싶으신가요?`,
        metadata: {
          type: 'strategy_inquiry',
          suggestedActions: [
            '리스크 비중 조정',
            '투자 기간 변경',
            '자산 배분 수정'
          ],
          parameters
        },
        requiresConfirmation: true
      };
    }
  }

  // Pattern commands
  if (type === 'pattern') {
    if (action === 'add') {
      const suggestions = [];
      if (parameters.technicalIndicators) {
        suggestions.push(`${parameters.technicalIndicators.join(', ')} 기반 패턴`);
      } else {
        suggestions.push('RSI 역전 패턴', '볼린저 밴드 패턴', '이동평균 크로스오버');
      }
      
      return {
        content: `${agent.name}: 새로운 매매 패턴을 추가하겠습니다! 현재 ${parameters.agentContext?.currentPatterns || 0}개의 패턴이 있습니다. 어떤 종류의 패턴을 만들어 드릴까요?`,
        metadata: {
          type: 'pattern_creation',
          currentCount: parameters.agentContext?.currentPatterns || 0,
          suggestions,
          parameters
        },
        requiresConfirmation: true
      };
    }
  }

  // Watchlist commands  
  if (type === 'watchlist') {
    if (action === 'add' && parameters.symbols) {
      const symbols = parameters.symbols;
      const alertPrice = parameters.prices?.[0];
      
      return {
        content: `${agent.name}: ${symbols.join(', ')}을(를) 관심종목에 추가하겠습니다. ${alertPrice ? `$${alertPrice.toLocaleString()}에 알림을 설정할게요.` : '알림 가격도 설정하시겠어요?'}`,
        metadata: {
          type: 'watchlist_addition',
          symbols,
          alertPrice,
          alertType: parameters.alertType,
          parameters
        },
        requiresConfirmation: true
      };
    }
  }

  // Info commands
  if (type === 'info') {
    return {
      content: `${agent.name}: 안녕하세요! 저는 ${agent.personality} 성향의 AI 투자 에이전트입니다. 현재 ${parameters.agentContext?.currentPatterns || 0}개의 매매 패턴과 ${parameters.agentContext?.currentWatchlist || 0}개의 관심종목을 관리하고 있습니다. 투자 전략 상담, 패턴 분석, 관심종목 관리를 도와드릴 수 있어요!`,
      metadata: {
        type: 'agent_info',
        capabilities: [
          '투자 전략 수정 및 최적화',
          '매매 패턴 생성 및 관리', 
          '관심종목 추가 및 알림 설정',
          '시장 분석 및 리포트 생성'
        ]
      }
    };
  }

  // Default response
  return {
    content: `${agent.name}: 네, 알겠습니다. 더 구체적인 정보가 필요하면 언제든지 말씀해 주세요!`,
    metadata: {
      type: 'general_acknowledgment',
      parsedCommand: command
    }
  };
}

// Validate if a command can be executed
export function validateCommand(command: ParsedCommand, agent: Agent): {
  valid: boolean;
  reason?: string;
  suggestions?: string[];
} {
  // Check if agent is active
  if (!agent.isActive) {
    return {
      valid: false,
      reason: '에이전트가 현재 비활성 상태입니다.',
      suggestions: ['에이전트를 먼저 활성화해 주세요.']
    };
  }

  // Validate strategy commands
  if (command.type === 'strategy' && command.action === 'add') {
    const maxStrategies = 10; // Arbitrary limit
    const currentStrategies = JSON.parse(agent.strategy || '[]').length;
    
    if (currentStrategies >= maxStrategies) {
      return {
        valid: false,
        reason: `최대 ${maxStrategies}개의 전략만 가질 수 있습니다.`,
        suggestions: ['기존 전략을 수정하거나 제거한 후 다시 시도해 주세요.']
      };
    }
  }

  // Validate pattern commands
  if (command.type === 'pattern' && command.action === 'add') {
    const maxPatterns = 20; // Arbitrary limit
    const currentPatterns = command.parameters.agentContext?.currentPatterns || 0;
    
    if (currentPatterns >= maxPatterns) {
      return {
        valid: false,
        reason: `최대 ${maxPatterns}개의 패턴만 가질 수 있습니다.`,
        suggestions: ['기존 패턴을 제거한 후 다시 시도해 주세요.']
      };
    }
  }

  // Validate watchlist commands
  if (command.type === 'watchlist' && command.action === 'add') {
    const maxWatchlist = 50; // Arbitrary limit  
    const currentWatchlist = command.parameters.agentContext?.currentWatchlist || 0;
    
    if (currentWatchlist >= maxWatchlist) {
      return {
        valid: false,
        reason: `최대 ${maxWatchlist}개의 관심종목만 가질 수 있습니다.`,
        suggestions: ['기존 관심종목을 제거한 후 다시 시도해 주세요.']
      };
    }
  }

  return { valid: true };
}