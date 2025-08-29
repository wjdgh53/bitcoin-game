'use client';

import { User, Bot, AlertCircle, CheckCircle, TrendingUp, Settings } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: string;
  personality: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  agentId: string;
  userId: string;
  content: string;
  type: 'user' | 'agent' | 'system';
  metadata: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  agent: Agent;
}

const getPersonalityColor = (personality: string) => {
  switch (personality) {
    case 'conservative':
      return 'bg-blue-500';
    case 'aggressive':
      return 'bg-red-500';
    case 'balanced':
      return 'bg-green-500';
    case 'quantitative':
      return 'bg-purple-500';
    case 'contrarian':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const parseMetadata = (metadata: string) => {
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
};

export default function MessageBubble({ message, agent }: MessageBubbleProps) {
  const metadata = parseMetadata(message.metadata);
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  // System messages (notifications, confirmations, etc.)
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // User messages (right side)
  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-in-right">
        <div className="flex items-end gap-2 max-w-[70%]">
          <div className="text-xs text-gray-800 mb-1">
            {formatTime(message.createdAt)}
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-2xl px-4 py-3 shadow-md message-bubble">
              <p className="text-sm leading-relaxed">{message.content}</p>
              
              {/* Special metadata indicators */}
              {metadata.command && (
                <div className="mt-2 pt-2 border-t border-yellow-400/30">
                  <div className="flex items-center gap-1 text-xs text-yellow-100">
                    <Settings className="h-3 w-3" />
                    <span>명령: {metadata.command}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Message tail */}
            <div className="absolute bottom-0 -right-1 w-0 h-0 border-l-[8px] border-l-orange-400 border-b-[8px] border-b-transparent"></div>
          </div>
          
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  // Agent messages (left side)
  return (
    <div className="flex justify-start animate-slide-in-left">
      <div className="flex items-end gap-2 max-w-[70%]">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getPersonalityColor(agent.personality)}`}>
          <Bot className="h-4 w-4 text-white" />
        </div>
        
        <div className="relative">
          <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100 message-bubble">
            <p className="text-sm leading-relaxed text-gray-800">{message.content}</p>
            
            {/* Special content based on metadata */}
            {metadata.type === 'strategy_update' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">전략이 업데이트되었습니다</span>
                </div>
                {metadata.changes && (
                  <ul className="mt-2 text-xs text-green-700 space-y-1">
                    {metadata.changes.map((change: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        {change}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {metadata.type === 'pattern_added' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">새 패턴이 추가되었습니다</span>
                </div>
                {metadata.pattern && (
                  <div className="mt-2 text-xs text-blue-700">
                    <p><strong>{metadata.pattern.name}</strong></p>
                    <p>{metadata.pattern.description}</p>
                  </div>
                )}
              </div>
            )}
            
            {metadata.type === 'watchlist_update' && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-purple-800">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">관심종목이 업데이트되었습니다</span>
                </div>
                {metadata.symbol && (
                  <div className="mt-2 text-xs text-purple-700">
                    <p><strong>{metadata.symbol}</strong> - {metadata.action}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Suggested actions */}
            {metadata.suggestions && (
              <div className="mt-3 space-y-1">
                {metadata.suggestions.map((suggestion: string, index: number) => (
                  <button
                    key={index}
                    className="block text-xs text-blue-600 hover:text-blue-800 hover:underline text-left"
                  >
                    💡 {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Message tail */}
          <div className="absolute bottom-0 -left-1 w-0 h-0 border-r-[8px] border-r-white border-b-[8px] border-b-transparent"></div>
        </div>
        
        <div className="text-xs text-gray-800 mb-1">
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}