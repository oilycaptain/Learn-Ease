import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AskAI = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [deletingChats, setDeletingChats] = useState(new Set());
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [newMessage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('textarea')?.focus();
      }
      if (e.key === 'Escape' && activeChat) {
        setActiveChat(null);
        setMessages([]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeChat]);

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { loadChats(); }, []);

  const loadChats = async () => {
    try {
      const res = await api.get('/chat');
      const list = Array.isArray(res.data) ? res.data : (res.data?.chats || []);
      setChats(list);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    }
  };

  const createNewChat = async () => {
    setCreatingChat(true);
    try {
      const res = await api.post('/chat', { title: 'New Chat' });
      const newChat = res.data?.chat || res.data;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat._id);
      setMessages(newChat.messages || []);
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const selectChat = async (chatId) => {
    try {
      const res = await api.get(`/chat/${chatId}`);
      const data = res.data?.chat || res.data || {};
      setActiveChat(chatId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    setDeletingChats(prev => new Set(prev).add(chatId));
    try {
      await api.delete(`/chat/${chatId}`);
      setChats(prev => prev.filter(c => c._id !== chatId));
      if (activeChat === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setDeletingChats(prev => {
        const n = new Set(prev);
        n.delete(chatId);
        return n;
      });
    }
  };

  const copyToClipboard = async (content, messageId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const tryUpdateTitle = async (chatId, title) => {
  const payload = { title };
  const attempts = [
    { method: 'patch', path: `/chat/${chatId}` },
    { method: 'put',   path: `/chat/${chatId}` },
    { method: 'patch', path: `/chats/${chatId}` },
    { method: 'patch', path: `/chat/${chatId}/title` },
  ];
  for (const a of attempts) {
    try {
      const res = await api[a.method](a.path, payload, { validateStatus: () => true });
      if (res?.status >= 200 && res?.status < 300) return true;
      if (res?.status !== 404 && res?.status !== 405) return false;
    } catch {
      return false;
    }
  }
  return false;
};


  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || loading) return;

    const userMessage = newMessage.trim();
    const wasEmpty = messages.length === 0;

    setNewMessage('');
    setLoading(true);

    const tempUserMessage = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const res = await api.post(`/chat/${activeChat}/messages`, { message: userMessage });
      const updated = res.data?.chat?.messages || res.data?.messages || [];
      setMessages(updated);

      if (wasEmpty) {
        const suggestedTitle = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
        try {
          await tryUpdateTitle(activeChat, suggestedTitle);
        } catch (_) {}
      }

      loadChats();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        _id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (timestamp) =>
    new Date(timestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const quickSuggestions = [
    'Explain quantum physics in simple terms',
    'Help me study for my biology exam',
    'Summarize the key points of World War II',
    'Create a study plan for learning Python'
  ];

  return (
    <div className="h-full min-h-0 overflow-hidden bg-gray-50 flex transition-all duration-300">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={createNewChat}
            disabled={creatingChat}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {creatingChat ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>New Chat</span>
              </>
            )}
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent Chats</h3>
            <div className="space-y-2">
              {chats.map(chat => (
                <div
                  key={chat._id}
                  onClick={() => selectChat(chat._id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group transform hover:scale-[1.02] ${
                    activeChat === chat._id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 scale-[1.02]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{chat.title || 'Untitled chat'}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(chat.lastActivity || chat.updatedAt || chat.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat._id, e)}
                      disabled={deletingChats.has(chat._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all duration-200 disabled:opacity-50"
                      title="Delete chat"
                    >
                      {deletingChats.has(chat._id) ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
              {chats.length === 0 && (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">💬</div>
                  <p className="text-gray-5 00 text-sm mb-2">No conversations yet</p>
                  <p className="text-gray-400 text-xs">Start chatting to see your history here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {activeChat ? (
          <>
            <div className="flex-1 min-h-0 overflow-hidden">
              <div ref={scrollContainerRef} className="h-full overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AI Assistant</h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Ask me anything! I can help with explanations, summaries, study tips, and more using the Qwen2.5 AI model.
                    </p>
                    <div className="max-w-2xl mx-auto mt-8">
                      <h3 className="text-sm font-medium text-gray-500 mb-4">Try asking:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Explain quantum physics in simple terms','Help me study for my biology exam','Summarize the key points of World War II','Create a study plan for learning Python'].map((s, i) => (
                          <button
                            key={i}
                            onClick={() => setNewMessage(s)}
                            className="p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 hover:shadow-md"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message._id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="relative group max-w-2xl">
                        <div
                          className={`rounded-2xl p-4 transition-all duration-300 transform ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          } ${String(message._id).startsWith('temp-') || String(message._id).startsWith('error-') ? 'animate-pulse' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            {message.role === 'assistant' && (
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                AI
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                            {message.role === 'user' && (
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {(user?.username?.charAt(0) || user?.name?.charAt(0) || 'U').toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => copyToClipboard(message.content, message._id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white border border-gray-300 rounded-md text-gray-600 hover:text-blue-600 transition-all duration-200 shadow-sm"
                            title="Copy to clipboard"
                          >
                            {copiedMessageId === message._id ? <span className="w-4 h-4 block text-green-500">✓</span> : '📋'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-2xl rounded-2xl p-4 bg-white border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">AI</div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
                <div className="flex space-x-4">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything... (⌘K to focus, Esc to close chat, Shift+Enter for new line)"
                    disabled={loading}
                    rows={1}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 resize-none min-h-[48px] max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </span>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">Powered by Qwen2.5 AI • Each chat is private to your account</p>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl text-white mb-6 mx-auto shadow-lg">🎓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to learn?</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your AI study assistant is here to help with explanations, summaries, and study tips. Start a conversation to begin!
              </p>
              <button
                onClick={createNewChat}
                disabled={creatingChat}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {creatingChat ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Chat...
                  </span>
                ) : (
                  'Start Learning Now'
                )}
              </button>
              <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
                  <span>Study Help</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
                  <span>Explanations</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
                  <span>Summaries</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
                  <span>Homework Help</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AskAI;
