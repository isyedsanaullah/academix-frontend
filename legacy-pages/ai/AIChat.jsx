'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  HiOutlinePaperAirplane,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineChatAlt2,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineSparkles,
  HiOutlineClipboardCopy,
  HiOutlineSpeakerphone,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlineSearch
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
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Mode Permissions
  const isAnnouncementAllowed = ['admin', 'principal', 'superAdmin'].includes(user?.role);
  const isReportAllowed = user?.role === 'superAdmin';

  // Active Mode: 'chat' | 'announcement' | 'report'
  const [chatMode, setChatMode] = useState('chat');
  const [activeDraft, setActiveDraft] = useState(null);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [draftToPublish, setDraftToPublish] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    if (isAnnouncementAllowed) fetchDrafts();
  }, [user?.role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText, streamStage]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/ai/chat/history');
      setConversations(data.data || []);
    } catch {
      /* no history yet */
    }
  };

  const fetchDrafts = async () => {
    if (!isAnnouncementAllowed) return;
    try {
      const { data } = await api.get('/ai/chat/drafts');
      setRecentDrafts(data.data || []);
    } catch {
      /* no drafts */
    }
  };

  const loadConversation = async (id) => {
    try {
      const { data } = await api.get(`/ai/chat/${id}`);
      setActiveConv(data.data);
      const fetchedMsgs = data.data.messages || [];
      setMessages(fetchedMsgs);

      if (data.data.metadata?.mode) {
        setChatMode(data.data.metadata.mode);
      }
      if (data.data.metadata?.activeDraft) {
        setActiveDraft(data.data.metadata.activeDraft);
      } else {
        setActiveDraft(null);
      }

      setMobileHistoryOpen(false);
      setInputDisabled(false);
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  const startNewChat = () => {
    setActiveConv(null);
    setMessages([]);
    setStreamText('');
    setStreamStage('');
    setActiveDraft(null);
    setInput('');
    setMobileHistoryOpen(false);
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
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const sendMessage = async (overrideMsg = null, refineAction = null) => {
    const msg = (overrideMsg || input).trim();
    if (!msg || streaming) return;
    if (!overrideMsg) setInput('');

    const userMsg = {
      role: 'user',
      content: msg,
      mode: chatMode,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setStreamText('');
    setStreamStage(
      chatMode === 'report'
        ? 'Analyzing report requirements & structure...'
        : chatMode === 'announcement'
        ? 'Analyzing situation & enforcing business rules...'
        : ''
    );

    try {
      const token = localStorage.getItem('academix_token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
      let reportData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'meta' && data.conversationId) {
                convId = data.conversationId;
              }
              if (data.type === 'status') {
                setStreamStage(data.stage);
              }
              if (data.type === 'text') {
                fullText += data.text;
                setStreamText(fullText);
              }
              if (data.type === 'announcement') {
                announcementData = data.announcement;
              }
              if (data.type === 'report_ready') {
                reportData = data.report;
              }
              if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              if (e.message && e.message !== 'Unexpected end of JSON input') {
                throw e;
              }
            }
          }
        }
      }

      // Add assistant response
      if (reportData) {
        const assistantMsg = {
          role: 'assistant',
          content: `Generated PDF Report: **${reportData.title}**\n\n${reportData.subtitle}`,
          mode: 'report',
          report: reportData,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else if (announcementData) {
        setActiveDraft(announcementData);
        const assistantMsg = {
          role: 'assistant',
          content: `**${announcementData.title}**\n\n${announcementData.content}`,
          mode: 'announcement',
          announcement: announcementData,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
        fetchDrafts();
      } else if (fullText) {
        const assistantMsg = {
          role: 'assistant',
          content: fullText,
          mode: chatMode,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

      fetchHistory();
      if (convId && !activeConv) {
        setActiveConv({ _id: convId });
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred during generation');
    } finally {
      setStreaming(false);
      setStreamText('');
      setStreamStage('');
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Announcement Actions
  const handlePublishClick = (draft) => {
    setDraftToPublish(draft);
    setConfirmModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!draftToPublish) return;
    setIsPublishing(true);
    try {
      await api.post('/announcements', {
        ...draftToPublish,
        status: 'Published'
      });
      toast.success('Announcement published successfully');
      setConfirmModalOpen(false);
      setActiveDraft(null);
      fetchDrafts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async (draft) => {
    try {
      await api.post('/announcements', {
        ...draft,
        status: 'Draft'
      });
      toast.success('Draft saved');
      setActiveDraft(null);
      fetchDrafts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save draft');
    }
  };

  const handleSchedule = async (draft, date) => {
    try {
      await api.post('/announcements', {
        ...draft,
        status: 'Scheduled',
        scheduledFor: date
      });
      toast.success('Announcement scheduled');
      setActiveDraft(null);
      fetchDrafts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    }
  };

  const handleRefine = (actionType) => {
    sendMessage(`Refine this announcement: ${actionType}`, actionType);
  };

  const handleEditChange = (updatedDraft) => {
    setActiveDraft(updatedDraft);
  };

  const roleLabel = {
    superAdmin: 'Super Admin Intelligence & Report Engine',
    admin: 'College Administrator AI Assistant',
    principal: 'Principal Leadership Assistant',
    teacher: 'Teacher Instructional Copilot',
    student: 'Student Study Companion',
    registrar: 'Registrar Admissions Assistant',
    accountant: 'Accountant Treasury Assistant'
  };

  // Filtered conversation list
  const filteredConversations = conversations.filter(c => {
    if (!historySearch.trim()) return true;
    return (c.title || '').toLowerCase().includes(historySearch.toLowerCase().trim());
  });

  return (
    <div className="w-full h-[calc(100vh-5.5rem)] flex flex-col md:flex-row rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0d1117] shadow-sm">
      {/* ─── DESKTOP SIDEBAR ────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-72 lg:w-80 shrink-0 border-r border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#12161f]">
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2">
          <button
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
          >
            <HiOutlinePlus size={16} /> New Session
          </button>
        </div>

        {/* History Search */}
        <div className="p-3 border-b border-slate-200/80 dark:border-white/[0.06]">
          <div className="relative">
            <HiOutlineSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-white/40">
              No previous conversations
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = activeConv?._id === conv._id;
              const isReport = conv.metadata?.mode === 'report';
              const isAnnounce = conv.metadata?.mode === 'announcement';

              return (
                <div
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl text-xs font-medium cursor-pointer transition group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-500/20'
                      : 'text-slate-600 dark:text-white/60 hover:bg-white dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isReport ? (
                      <HiOutlineDocumentText size={16} className="text-violet-500 shrink-0" />
                    ) : isAnnounce ? (
                      <HiOutlineSpeakerphone size={16} className="text-amber-500 shrink-0" />
                    ) : (
                      <HiOutlineChatAlt2 size={16} className="text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{conv.title || 'Untitled Chat'}</span>
                  </div>

                  <button
                    onClick={e => deleteConv(conv._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                    title="Delete Conversation"
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── MOBILE HISTORY DRAWER / MODAL ─────────────────────────────── */}
      {mobileHistoryOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileHistoryOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs h-full bg-white dark:bg-[#12161f] border-r border-slate-200 dark:border-white/[0.06] shadow-2xl flex flex-col z-10 animate-slide-right">
            <div className="p-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineClock size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Chat History</span>
              </div>
              <button
                onClick={() => setMobileHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 dark:border-white/[0.06]">
              <button
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white shadow-sm"
              >
                <HiOutlinePlus size={16} /> New Session
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map(conv => (
                <div
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  className="flex items-center justify-between p-3 rounded-xl text-xs font-medium text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                >
                  <span className="truncate flex-1">{conv.title}</span>
                  <button
                    onClick={e => deleteConv(conv._id, e)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CHAT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d1117]">
        {/* Top Chat Header */}
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-3 bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile History Button */}
            <button
              onClick={() => setMobileHistoryOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              title="Chat History"
            >
              <HiOutlineClock size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  Academix AI Intelligence
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20 uppercase tracking-wider hidden sm:inline-block">
                  {user?.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-white/40 truncate">
                {roleLabel[user?.role] || 'Institutional Assistant'}
              </p>
            </div>
          </div>

          {/* New Chat Button (Mobile) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={startNewChat}
              className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm"
              title="New Chat"
            >
              <HiOutlinePlus size={16} />
            </button>
          </div>
        </div>

        {/* ─── 3-MODE SWITCHER TOOLBAR (ZERO EMOJIS) ────────────────────── */}
        <div className="px-4 py-2 border-b border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {/* Mode 1: Standard Chat */}
          <button
            onClick={() => setChatMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              chatMode === 'chat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:bg-slate-200/70 dark:hover:bg-white/[0.04]'
            }`}
          >
            <HiOutlineChatAlt2 size={15} />
            <span>Standard Chat</span>
          </button>

          {/* Mode 2: Announcement Generator */}
          {isAnnouncementAllowed && (
            <button
              onClick={() => setChatMode('announcement')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                chatMode === 'announcement'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-200/70 dark:hover:bg-white/[0.04]'
              }`}
            >
              <HiOutlineSpeakerphone size={15} />
              <span>Announcement Generator</span>
            </button>
          )}

          {/* Mode 3: PDF Report Generator (Super Admin Only) */}
          {isReportAllowed && (
            <button
              onClick={() => setChatMode('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                chatMode === 'report'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-white/60 hover:bg-slate-200/70 dark:hover:bg-white/[0.04]'
              }`}
            >
              <HiOutlineDocumentText size={15} />
              <span>PDF Report Generator</span>
            </button>
          )}
        </div>

        {/* ─── MESSAGE STREAM ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3 py-12">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                {chatMode === 'report' ? (
                  <HiOutlineDocumentText size={26} />
                ) : chatMode === 'announcement' ? (
                  <HiOutlineSpeakerphone size={26} />
                ) : (
                  <HiOutlineSparkles size={26} />
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {chatMode === 'report'
                  ? 'AI-Powered PDF Report Generator'
                  : chatMode === 'announcement'
                  ? 'College Announcement Studio'
                  : 'How can Academix AI assist you?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">
                {chatMode === 'report'
                  ? 'Request executive platform reports, enrollment breakdowns, college comparison audits, and subscription metrics. Backend generates branded PDF reports with vector charts.'
                  : chatMode === 'announcement'
                  ? 'Describe an institutional event or situation. AI prepares a structured, publishable announcement draft for review.'
                  : 'Ask administrative questions, inquire about platform analytics, or query operational procedures.'}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                    {msg.mode === 'report' ? (
                      <HiOutlineDocumentText size={16} />
                    ) : msg.mode === 'announcement' ? (
                      <HiOutlineSpeakerphone size={16} />
                    ) : (
                      <HiOutlineSparkles size={16} />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[92%] sm:max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm shadow-sm'
                      : 'w-full space-y-2'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : msg.mode === 'report' && msg.report ? (
                    /* ─── AI GENERATED REPORT CARD ──────────────────────── */
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-violet-500/30 shadow-md space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                          <HiOutlineDocumentText size={22} />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 uppercase tracking-wider">
                              Executive PDF Report
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-white/40">
                              {msg.report.generatedAt
                                ? new Date(msg.report.generatedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                            {msg.report.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-white/60">
                            {msg.report.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/60 font-medium">
                          Sections: {msg.report.sectionsCount || 3}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/60 font-medium">
                          Pages: {msg.report.pageCount || 1}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/60 font-mono text-[11px]">
                          Token: {msg.report.token?.substring(0, 8)}...
                        </span>
                      </div>

                      {/* Download & Preview Actions */}
                      <div className="flex items-center gap-2.5 pt-2">
                        <button
                          onClick={() => window.open(msg.report.previewUrl, '_blank')}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.06] transition"
                        >
                          <HiOutlineEye size={15} /> Preview PDF
                        </button>

                        <a
                          href={msg.report.downloadUrl}
                          download
                          className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                        >
                          <HiOutlineDownload size={15} /> Download PDF
                        </a>
                      </div>
                    </div>
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
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] shadow-sm text-sm text-slate-800 dark:text-white/90">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      <button
                        onClick={() => copyText(msg.content)}
                        className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 transition"
                      >
                        <HiOutlineClipboardCopy size={13} /> Copy response
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Real-time Streaming Progress Banner */}
          {streaming && streamStage && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 animate-pulse max-w-md">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping shrink-0" />
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 truncate">
                {streamStage}
              </p>
            </div>
          )}

          {/* Live text streaming */}
          {streaming && streamText && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0">
                <HiOutlineSparkles size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161b22] border border-slate-200/80 dark:border-white/[0.06] text-sm text-slate-800 dark:text-white/90 flex-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── INPUT AREA ──────────────────────────────────────────────── */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#0d1117] shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  chatMode === 'report'
                    ? 'Prompt the report you need (e.g. Generate audit report comparing all colleges by enrollment and plan)...'
                    : chatMode === 'announcement'
                    ? 'Describe the announcement scenario (e.g. Tomorrow campus will close early at 1 PM)...'
                    : 'Ask anything or discuss operations...'
                }
                rows={1}
                disabled={streaming || inputDisabled}
                className="w-full pl-4 pr-10 py-3 text-sm rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm resize-none"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={() => sendMessage()}
              disabled={streaming || inputDisabled || !input.trim()}
              className={`p-3 rounded-xl text-white shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                chatMode === 'report'
                  ? 'bg-violet-600 hover:bg-violet-700'
                  : chatMode === 'announcement'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              title="Send Prompt"
            >
              <HiOutlinePaperAirplane size={18} className="rotate-90" />
            </button>
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
