import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  HiOutlinePaperAirplane, HiOutlinePlus, HiOutlineTrash,
  HiOutlineChatAlt2, HiOutlineMenu, HiOutlineX,
  HiOutlineSparkles, HiOutlineClipboardCopy,
  HiOutlineSpeakerphone, HiOutlineClock
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import AnnouncementCard from '../../components/common/AnnouncementCard';
import PublishConfirmationModal from '../../components/common/PublishConfirmationModal';

const AIChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [streamStage, setStreamStage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);

  // Announcement Mode State
  const isAnnouncementAllowed = ['admin', 'principal', 'superAdmin'].includes(user?.role);
  const [chatMode, setChatMode] = useState('chat'); // 'chat' | 'announcement'
  const [activeDraft, setActiveDraft] = useState(null);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [draftToPublish, setDraftToPublish] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchHistory(); fetchDrafts(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamText, streamStage]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/ai/chat/history');
      setConversations(data.data || []);
    } catch { /* no history yet */ }
  };

  const fetchDrafts = async () => {
    if (!isAnnouncementAllowed) return;
    try {
      const { data } = await api.get('/ai/chat/drafts');
      setRecentDrafts(data.data || []);
    } catch { /* no drafts */ }
  };

  const loadConversation = async (id) => {
    try {
      const { data } = await api.get(`/ai/chat/${id}`);
      setActiveConv(data.data);
      const fetchedMsgs = data.data.messages || [];
      setMessages(fetchedMsgs);

      // Check if conversation has an active draft
      if (data.data.metadata?.activeDraft) {
        setActiveDraft(data.data.metadata.activeDraft);
        setChatMode('announcement');
      } else {
        setActiveDraft(null);
      }

      setSidebarOpen(false);
      setInputDisabled(false);
    } catch { toast.error('Failed to load conversation'); }
  };

  const startNewChat = () => {
    setActiveConv(null);
    setMessages([]);
    setStreamText('');
    setStreamStage('');
    setActiveDraft(null);
    setInput('');
    setSidebarOpen(false);
    setInputDisabled(false);
    inputRef.current?.focus();
  };

  const deleteConv = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/chat/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeConv?._id === id) startNewChat();
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const sendMessage = async (overrideMsg = null, refineAction = null) => {
    const msg = (overrideMsg || input).trim();
    if (!msg || streaming) return;
    if (!overrideMsg) setInput('');

    // Add user message
    const userMsg = {
      role: 'user',
      content: msg,
      mode: chatMode,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setStreamText('');
    setStreamStage(chatMode === 'announcement' ? 'Analyzing announcement request...' : '');

    try {
      const token = localStorage.getItem('academix_token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: msg,
          conversationId: activeConv?._id || null,
          mode: chatMode,
          existingDraft: activeDraft || null,
          action: refineAction || null
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let convId = activeConv?._id;
      let announcementData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));

            if (parsed.type === 'meta' && parsed.conversationId) {
              convId = parsed.conversationId;
              continue;
            }

            if (parsed.type === 'status' && parsed.stage) {
              setStreamStage(parsed.stage);
              continue;
            }

            if (parsed.type === 'announcement' && parsed.announcement) {
              announcementData = parsed.announcement;
              setActiveDraft(parsed.announcement);
              continue;
            }

            if (parsed.limitExceeded) {
              setInputDisabled(true);
            }

            if (parsed.text && !parsed.done) {
              fullText += parsed.text;
              setStreamText(fullText);
            }

            if (parsed.done) {
              // Finalize response
              if (announcementData) {
                const assistantMsg = {
                  role: 'assistant',
                  mode: 'announcement',
                  content: announcementData.title,
                  announcement: announcementData,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMsg]);
              } else if (fullText) {
                const assistantMsg = {
                  role: 'assistant',
                  content: fullText,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMsg]);
              }

              setStreamText('');
              setStreamStage('');

              if (convId && !activeConv) {
                setActiveConv({ _id: convId });
              }
              fetchHistory();
              fetchDrafts();
            }
          } catch { /* skip parse errors */ }
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send');
      setStreamText('');
      setStreamStage('');
    } finally {
      setStreaming(false);
    }
  };

  // Announcement Action Handlers
  const handlePublishClick = (draft) => {
    setDraftToPublish(draft);
    setConfirmModalOpen(true);
  };

  // Persist announcement status change back into the saved conversation message in DB
  const persistAnnouncementStatus = async (draft, status, extra = {}) => {
    const convId = activeConv?._id;
    if (!convId || !draft?.draftSessionId) return;
    try {
      await api.patch(`/ai/chat/${convId}/announcement-status`, {
        draftSessionId: draft.draftSessionId,
        status,
        ...extra
      });
    } catch { /* non-critical — UI already updated */ }
  };

  const handleConfirmPublish = async () => {
    if (!draftToPublish) return;
    setIsPublishing(true);
    try {
      const { data } = await api.post('/announcements', {
        ...draftToPublish,
        status: 'Published'
      });
      toast.success('📢 Announcement published successfully!');
      setConfirmModalOpen(false);

      // Update active draft & message status in local state
      const updatedDraft = { ...draftToPublish, status: 'Published', id: data.data._id };
      setActiveDraft(updatedDraft);
      setMessages(prev => prev.map(m => m.announcement?.draftSessionId === draftToPublish.draftSessionId
        ? { ...m, announcement: updatedDraft }
        : m
      ));

      // Persist status into DB so reload shows correct state
      await persistAnnouncementStatus(draftToPublish, 'Published', { announcementId: data.data._id });
      fetchDrafts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async (draft) => {
    try {
      const { data } = await api.post('/announcements', {
        ...draft,
        status: 'Draft'
      });
      toast.success('💾 Announcement saved as Draft!');
      const updatedDraft = { ...draft, status: 'Draft (Saved)', id: data.data._id };
      setActiveDraft(updatedDraft);
      setMessages(prev => prev.map(m => m.announcement?.draftSessionId === draft.draftSessionId
        ? { ...m, announcement: updatedDraft }
        : m
      ));
      fetchDrafts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save draft');
    }
  };

  const handleSchedule = async (draft) => {
    if (!draft.scheduledFor) {
      toast.error('Please select a scheduled date and time');
      return;
    }
    try {
      const { data } = await api.post('/announcements', {
        ...draft,
        status: 'Scheduled'
      });
      toast.success(`📅 Announcement scheduled for ${new Date(draft.scheduledFor).toLocaleString()}!`);
      const updatedDraft = { ...draft, status: 'Scheduled', id: data.data._id };
      setActiveDraft(updatedDraft);
      setMessages(prev => prev.map(m => m.announcement?.draftSessionId === draft.draftSessionId
        ? { ...m, announcement: updatedDraft }
        : m
      ));

      // Persist status into DB so reload shows correct state
      await persistAnnouncementStatus(draft, 'Scheduled', {
        scheduledFor: draft.scheduledFor,
        announcementId: data.data._id
      });
      fetchDrafts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule announcement');
    }
  };

  const handleRefine = (actionId, actionLabel) => {
    sendMessage(`Refine announcement: ${actionLabel}`, actionId);
  };

  const handleEditChange = (updatedDraft) => {
    setActiveDraft(updatedDraft);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!', { duration: 1500 });
  };

  const roleLabel = {
    student: 'Course Material Assistant',
    teacher: 'Teaching Assistant',
    principal: 'Management Advisor & Announcement Center',
    admin: 'AI Assistant & Announcement Center',
    superAdmin: 'AI Assistant & Announcement Center'
  };

  const announcementPrompts = [
    'Tomorrow college will remain closed because of heavy rain.',
    'Mid exams are postponed until further notice.',
    'Fee submission deadline has been extended to Friday.',
    'Teachers meeting tomorrow at 10 AM in Conference Hall.',
    'Admissions are now open for academic session 2026-2027.'
  ];

  return (
    <div className="flex h-[calc(100vh-73px)] -m-5 sm:-m-6">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 lg:z-auto inset-y-0 left-0 w-72 bg-[#0a0e14] border-r border-white/[0.06] flex flex-col transition-transform duration-200`}>
        <div className="p-3 border-b border-white/[0.06]">
          <button onClick={startNewChat} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15 transition text-sm font-semibold">
            <HiOutlinePlus size={16} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <p className="text-center text-white/20 text-xs py-8">No conversations yet</p>
          ) : conversations.map(conv => (
            <div key={conv._id} onClick={() => loadConversation(conv._id)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') loadConversation(conv._id); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition group cursor-pointer ${
                activeConv?._id === conv._id
                  ? 'bg-white/[0.06] text-white/80'
                  : 'text-white/40 hover:bg-white/[0.03] hover:text-white/60'
              }`}>
              {conv.metadata?.mode === 'announcement' ? (
                <HiOutlineSpeakerphone size={14} className="shrink-0 text-amber-400" />
              ) : (
                <HiOutlineChatAlt2 size={14} className="shrink-0" />
              )}
              <span className="text-xs truncate flex-1">{conv.title}</span>
              <button onClick={(e) => deleteConv(conv._id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition">
                <HiOutlineTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b0f17]">
        {/* Chat Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#0d1117]/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5">
              <HiOutlineMenu size={18} />
            </button>
            <HiOutlineSparkles className="text-indigo-400 shrink-0" size={18} />
            <span className="text-sm font-semibold text-white/70 truncate">{roleLabel[user?.role] || 'AI Assistant'}</span>
            {activeConv && <span className="text-[11px] text-white/25 truncate">— {activeConv.title || 'Chat'}</span>}
          </div>

          {/* Mode Switcher Pill */}
          {isAnnouncementAllowed && (
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setChatMode('chat')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  chatMode === 'chat'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                💬 Chat
              </button>
              <button
                onClick={() => setChatMode('announcement')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  chatMode === 'announcement'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold shadow-md'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                📢 Announcement
              </button>
            </div>
          )}
        </div>

        {/* Recent Drafts Bar (Announcement Mode) */}
        {isAnnouncementAllowed && chatMode === 'announcement' && recentDrafts.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 shrink-0">
              <HiOutlineClock size={12} /> Recent Drafts:
            </span>
            <div className="flex gap-1.5 overflow-x-auto py-0.5">
              {recentDrafts.map(d => (
                <button
                  key={d.conversationId}
                  onClick={() => loadConversation(d.conversationId)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white transition shrink-0 truncate max-w-[200px]">
                  {d.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && !streamText && !streaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-amber-500/20 flex items-center justify-center mb-4 border border-indigo-500/20">
                {chatMode === 'announcement' ? (
                  <HiOutlineSpeakerphone className="text-amber-400" size={30} />
                ) : (
                  <HiOutlineSparkles className="text-indigo-400" size={28} />
                )}
              </div>

              <h2 className="text-lg font-bold text-white/80 mb-1">
                {chatMode === 'announcement' ? 'AI Announcement Generator' : roleLabel[user?.role] || 'AI Assistant'}
              </h2>

              <p className="text-white/30 text-sm max-w-md mb-6">
                {chatMode === 'announcement'
                  ? 'Describe a situation in plain language. AI will format, structure, and categorize a ready-to-publish announcement preview with complete actions.'
                  : 'Ask about educational management, academic queries, or study materials.'}
              </p>

              {/* Quick Prompts for Announcement Mode */}
              {chatMode === 'announcement' && (
                <div className="w-full max-w-lg space-y-2">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Try an example situation:</p>
                  <div className="flex flex-col gap-1.5">
                    {announcementPrompts.map((promptText, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(promptText)}
                        className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-white/70 text-left transition hover:border-amber-500/30 flex items-center justify-between group">
                        <span>"{promptText}"</span>
                        <HiOutlinePaperAirplane size={14} className="text-amber-400 opacity-0 group-hover:opacity-100 transition rotate-90" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-1">
                      {msg.mode === 'announcement' ? (
                        <HiOutlineSpeakerphone className="text-amber-300" size={16} />
                      ) : (
                        <HiOutlineSparkles className="text-white" size={14} />
                      )}
                    </div>
                  )}

                  <div className={`max-w-[92%] sm:max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-indigo-500/15 border border-indigo-500/20 rounded-2xl rounded-br-md px-4 py-3'
                      : msg.mode === 'announcement' && msg.announcement
                      ? 'w-full'
                      : 'bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-white/85 text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : msg.mode === 'announcement' && msg.announcement ? (
                      <AnnouncementCard
                        announcement={msg.announcement}
                        mode="preview"
                        onPublish={handlePublishClick}
                        onSaveDraft={handleSaveDraft}
                        onSchedule={handleSchedule}
                        onRefine={handleRefine}
                        onEditChange={handleEditChange}
                        authorName={user?.name || 'Administrator'}
                      />
                    ) : (
                      <div className="prose-chat text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        <button onClick={() => copyText(msg.content)}
                          className="mt-2 flex items-center gap-1 text-[10px] text-white/20 hover:text-white/50 transition">
                          <HiOutlineClipboardCopy size={12} /> Copy
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-1 text-white font-bold text-xs">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming Progress Status Pill */}
              {streaming && streamStage && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 animate-pulse">
                    <HiOutlineSparkles className="text-slate-950 font-bold" size={16} />
                  </div>
                  <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>{streamStage}</span>
                  </div>
                </div>
              )}

              {/* Streaming Response */}
              {streaming && streamText && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-1">
                    <HiOutlineSparkles className="text-white" size={14} />
                  </div>
                  <div className="max-w-[85%] bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="prose-chat text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#0d1117]/50 p-4">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Mode Indicator Chip above textarea */}
            {isAnnouncementAllowed && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-white/40 font-medium">Mode:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  chatMode === 'announcement' ? 'text-amber-400 bg-amber-500/10' : 'text-indigo-400 bg-indigo-500/10'
                }`}>
                  {chatMode === 'announcement' ? '📢 Announcement Creation' : '💬 Standard Chat'}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={
                    chatMode === 'announcement'
                      ? 'Describe the situation (e.g. Tomorrow college will remain closed due to heavy rain...)'
                      : user?.role === 'student'
                      ? 'Ask about your study material...'
                      : 'Type your message...'
                  }
                  rows={1}
                  className="w-full px-4 py-3 bg-[#1a2230] border border-white/10 rounded-xl text-white/85 text-sm font-sans outline-none transition-all placeholder:text-white/30 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] resize-none overflow-hidden"
                  style={{ minHeight: '46px', maxHeight: '120px' }}
                  disabled={streaming || inputDisabled}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={streaming || inputDisabled || !input.trim()}
                className={`px-4 py-3 text-white rounded-xl hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${
                  chatMode === 'announcement'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-600'
                }`}>
                <HiOutlinePaperAirplane size={18} className="rotate-90" />
              </button>
            </div>

            <p className="text-[10px] text-white/15 text-center">
              AI responses use your personal Gemini API key. Announcements require explicit confirmation before publishing.
            </p>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      <PublishConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmPublish}
        announcement={draftToPublish}
        isSubmitting={isPublishing}
      />
    </div>
  );
};

export default AIChat;
