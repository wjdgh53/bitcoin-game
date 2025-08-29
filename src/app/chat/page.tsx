'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Search, Users, Settings } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AgentList from '@/components/chat/AgentList';
import ChatInterface from '@/components/chat/ChatInterface';

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

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        
        // Auto-select first agent if available
        if (data.agents && data.agents.length > 0 && !selectedAgentId) {
          setSelectedAgentId(data.agents[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (agentId: string) => {
    try {
      const response = await fetch(`/api/chat/${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({
          ...prev,
          [agentId]: data.messages || []
        }));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    if (!messages[agentId]) {
      fetchMessages(agentId);
    }
  };

  const handleSendMessage = async (agentId: string, content: string) => {
    try {
      const response = await fetch(`/api/chat/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type: 'user'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({
          ...prev,
          [agentId]: [...(prev[agentId] || []), data.userMessage, data.agentResponse]
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.personality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-700 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-800">채팅을 준비하고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main Chat Container */}
      <div className="h-[calc(100vh-4rem)] flex bg-gradient-to-br from-yellow-50 to-orange-50">
        {/* Agent List Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-orange-400">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-white" />
                AI 에이전트 채팅
              </h1>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <Users className="h-4 w-4 text-white" />
                </button>
                <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <Settings className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700" />
              <input
                type="text"
                placeholder="에이전트 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/90 backdrop-blur-sm border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Agent List */}
          <AgentList
            agents={filteredAgents}
            selectedAgentId={selectedAgentId}
            onAgentSelect={handleAgentSelect}
            messages={messages}
          />
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedAgent ? (
            <ChatInterface
              agent={selectedAgent}
              messages={messages[selectedAgentId!] || []}
              onSendMessage={(content) => handleSendMessage(selectedAgentId!, content)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  에이전트를 선택해주세요
                </h3>
                <p className="text-gray-800">
                  왼쪽에서 대화하고 싶은 AI 에이전트를 클릭하세요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}