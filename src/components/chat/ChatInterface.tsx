'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Info, Settings2, Zap } from 'lucide-react';
import MessageBubble from './MessageBubble';

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

interface ChatInterfaceProps {
  agent: Agent;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

const getPersonalityLabel = (personality: string) => {
  switch (personality) {
    case 'conservative':
      return '보수적';
    case 'aggressive':
      return '공격적';
    case 'balanced':
      return '균형적';
    case 'quantitative':
      return '정량적';
    case 'contrarian':
      return '역발상';
    default:
      return personality;
  }
};

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

export default function ChatInterface({ agent, messages, onSendMessage }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      await onSendMessage(messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPersonalityColor(agent.personality)}`}>
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{agent.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{getPersonalityLabel(agent.personality)} 에이전트</span>
                {agent.isActive ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>온라인</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>오프라인</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="에이전트 정보"
            >
              <Info className="h-4 w-4 text-gray-500" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="설정"
            >
              <Settings2 className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Agent Info Panel */}
        {showInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              <strong>설명:</strong> {agent.description}
            </div>
            <div className="text-sm text-gray-600">
              <strong>타입:</strong> {agent.type}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-4 space-y-4 chat-messages">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getPersonalityColor(agent.personality)} mb-4`}>
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {agent.name}와의 첫 대화
            </h3>
            <p className="text-gray-600 mb-4 max-w-md">
              안녕하세요! 저는 {getPersonalityLabel(agent.personality)} 성향의 AI 투자 에이전트입니다. 
              투자 전략, 패턴 분석, 관심종목에 대해 대화해보세요.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
              <button onClick={() => setInputMessage('전략 수정해줘')} className="p-2 bg-white rounded-lg border hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 shadow-sm">💡 "전략 수정해줘"</button>
              <button onClick={() => setInputMessage('패턴 추가해줘')} className="p-2 bg-white rounded-lg border hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 shadow-sm">📈 "패턴 추가해줘"</button>
              <button onClick={() => setInputMessage('관심종목 관리')} className="p-2 bg-white rounded-lg border hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 shadow-sm">⭐ "관심종목 관리"</button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                agent={agent}
              />
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPersonalityColor(agent.personality)} shadow-md`}>
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`${agent.name}에게 메시지를 보내세요...`}
              disabled={!agent.isActive}
              className="w-full px-4 py-3 pr-12 bg-gray-100 border-0 rounded-2xl resize-none focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all min-h-[48px] max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ height: '48px' }}
              rows={1}
            />
            
            {/* Quick Actions */}
            {inputMessage === '' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <button
                  onClick={() => setInputMessage('내 전략을 수정해줘')}
                  className="p-1.5 text-gray-400 hover:text-yellow-600 transition-colors"
                  title="전략 수정"
                >
                  <Zap className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping || !agent.isActive}
            className="p-3 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {!agent.isActive && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            이 에이전트는 현재 비활성 상태입니다
          </p>
        )}
      </div>
    </div>
  );
}