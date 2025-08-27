'use client';

import { useState, useEffect } from 'react';
import { Bot, Circle, Clock, MessageCircle2 } from 'lucide-react';

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

interface AgentListProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
  messages: Record<string, ChatMessage[]>;
}

const getPersonalityColor = (personality: string) => {
  switch (personality) {
    case 'conservative':
      return 'bg-blue-100 text-blue-800';
    case 'aggressive':
      return 'bg-red-100 text-red-800';
    case 'balanced':
      return 'bg-green-100 text-green-800';
    case 'quantitative':
      return 'bg-purple-100 text-purple-800';
    case 'contrarian':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

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

const getLastMessage = (messages: ChatMessage[]) => {
  if (!messages || messages.length === 0) return null;
  return messages[messages.length - 1];
};

const getUnreadCount = (messages: ChatMessage[]) => {
  if (!messages) return 0;
  return messages.filter(msg => msg.type === 'agent' && !msg.isRead).length;
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  });
};

export default function AgentList({ agents, selectedAgentId, onAgentSelect, messages }: AgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Bot className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">사용 가능한 에이전트가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {agents.map((agent) => {
        const lastMessage = getLastMessage(messages[agent.id]);
        const unreadCount = getUnreadCount(messages[agent.id]);
        const isSelected = selectedAgentId === agent.id;

        return (
          <button
            key={agent.id}
            onClick={() => onAgentSelect(agent.id)}
            className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 text-left relative ${
              isSelected ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-r-4 border-r-yellow-500 shadow-sm' : ''
            } hover:shadow-sm`}
          >
            <div className="flex items-start gap-3">
              {/* Agent Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                  agent.isActive ? 'bg-gradient-to-br from-yellow-100 to-orange-100 shadow-md' : 'bg-gray-100'
                }`}>
                  <Bot className={`h-6 w-6 ${
                    agent.isActive ? 'text-yellow-600' : 'text-gray-400'
                  }`} />
                </div>
                
                {/* Online Status */}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <div className={`w-4 h-4 rounded-full border-2 border-white ${
                    agent.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  } shadow-sm`}></div>
                </div>
              </div>

              {/* Agent Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {agent.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    {lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(lastMessage.createdAt)}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <div className="bg-red-500 text-white rounded-full min-w-[20px] h-[20px] flex items-center justify-center text-xs font-bold ml-1 shadow-lg animate-bounce">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonalityColor(agent.personality)}`}>
                    {getPersonalityLabel(agent.personality)}
                  </span>
                  {!agent.isActive && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      비활성
                    </span>
                  )}
                </div>

                {/* Last Message Preview */}
                {lastMessage ? (
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessage.type === 'user' ? '나: ' : ''}
                    {lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    대화를 시작해보세요
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}