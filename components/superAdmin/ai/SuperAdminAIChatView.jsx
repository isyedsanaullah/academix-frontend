'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from '@/store/authStore';
import { getHostType, getTenantSlug } from '@/lib/host';
import Icon from '@/components/Icon';
import Search from '@/components/ui/Search';
import Button from '@/components/ui/Button';
import AnnouncementCard from '@/components/common/AnnouncementCard';
import PublishConfirmationModal from '@/components/common/PublishConfirmationModal';

const CHAT_MODES = [
  {
    id: 'chat',
    label: 'Standard Chat',
    shortLabel: 'Standard Chat',
    icon: 'chat-think',
    description: 'Platform Q&A & Operational Insights',
    placeholder: 'Ask anything about college metrics, platform financials, or system management...',
    badgeColor: 'text-primary-01 bg-primary-01/10 border-primary-01/20',
  },
  {
    id: 'announcement',
    label: 'Announcement Generator',
    shortLabel: 'Announcement',
    icon: 'speakerphone',
    description: 'Cross-Campus Broadcasts & Circulars',
    placeholder: 'Describe the announcement scenario (e.g. Scheduled campus maintenance this Saturday)...',
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'report',
    label: 'PDF Report Generator',
    shortLabel: 'PDF Report',
    icon: 'document-text',
    description: 'Executive Branded PDF Reports',
    placeholder: 'Prompt the report you need (e.g. Comparative college audit by enrollment and plan)...',
    badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
];

const SUGGESTED_PROMPTS = {
  chat: [
    { title: 'College Comparison', prompt: 'Compare all active colleges by student enrollment and assigned subscription tier' },
    { title: 'Platform Analytics', prompt: 'Summarize overall platform health, active users, and system alerts' },
    { title: 'Pending Subscriptions', prompt: 'Audit pending college subscription requests and overdue billing invoices' },
  ],
  announcement: [
    { title: 'Platform Maintenance', prompt: 'Announce scheduled platform maintenance window for all campuses this weekend' },
    { title: 'Academic Schedule Notice', prompt: 'Draft official circular regarding the upcoming semester examination deadlines' },
    { title: 'Fee Deadline Advisory', prompt: 'Create urgent notification for college accountants regarding fee clearance date' },
  ],
  report: [
    { title: 'All Colleges Audit', prompt: 'Generate executive audit report comparing all colleges by enrollment and subscription status' },
    { title: 'Financial Overview', prompt: 'Generate annual financial ledger report detailing payment collection and pending dues' },
    { title: 'Institutional Health', prompt: 'Generate platform performance summary report for executive board review' },
  ],
};

const SuperAdminAIChatView = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [streamStage, setStreamStage] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [inputDisabled, setInputDisabled] = useState(false);

  // Inner AI Chat Sidebar collapsible state (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active Mode: 'chat' | 'announcement' | 'report'
  const [chatMode, setChatMode] = useState('chat');
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState(null);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [draftToPublish, setDraftToPublish] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modeDropdownRef = useRef(null);

  // Close drop-up on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target)) {
        setModeDropdownOpen(false);
      }
    };
    if (modeDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [modeDropdownOpen]);

  // Load persisted sidebar state
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cesms-ai-chat-sidebar-collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('cesms-ai-chat-sidebar-collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  // Fetch history and drafts on mount
  useEffect(() => {
    fetchHistory();
    fetchDrafts();
  }, [user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText, streamStage]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/ai/chat/history');
      setConversations(data.data || []);
    } catch {
      /* history empty */
    }
  };

  const fetchDrafts = async () => {
    try {
      const { data } = await api.get('/ai/chat/drafts');
      setRecentDrafts(data.data || []);
    } catch {
      /* drafts empty */
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

      setMobileSidebarOpen(false);
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
    setMobileSidebarOpen(false);
    setInputDisabled(false);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.focus();
    }
  };

  const deleteConv = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/chat/${id}`);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (activeConv?._id === id) startNewChat();
      toast.success('Conversation removed');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const sendMessage = async (overrideMsg = null, refineAction = null) => {
    const msg = (overrideMsg || input).trim();
    if (!msg || streaming) return;
    if (!overrideMsg) {
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }

    const userMsg = {
      role: 'user',
      content: msg,
      mode: chatMode,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamText('');
    setStreamStage(
      chatMode === 'report'
        ? 'Analyzing platform dataset & formatting PDF report...'
        : chatMode === 'announcement'
          ? 'Drafting announcement & enforcing administrative guidelines...'
          : 'Retrieving intelligence & calculating metrics...'
    );

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('academix_token') : null;
      const baseUrl = api.defaults?.baseURL || process.env.NEXT_PUBLIC_API_URL || '/api';
      const hostType = typeof window !== 'undefined' ? getHostType(window.location.hostname) : null;
      const tenantSlug = typeof window !== 'undefined' ? getTenantSlug(window.location.hostname) : null;

      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (hostType) headers['X-Host-Type'] = hostType;
      if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug;

      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: msg,
          conversationId: activeConv?._id || null,
          mode: chatMode,
          existingDraft: activeDraft || null,
          action: refineAction || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to communicate with AI service');
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
          content: `Generated PDF Report: **${reportData.title}**\n\n${reportData.subtitle || ''}`,
          mode: 'report',
          report: reportData,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (announcementData) {
        setActiveDraft(announcementData);
        const assistantMsg = {
          role: 'assistant',
          content: `**${announcementData.title}**\n\n${announcementData.content}`,
          mode: 'announcement',
          announcement: announcementData,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        fetchDrafts();
      } else if (fullText) {
        const assistantMsg = {
          role: 'assistant',
          content: fullText,
          mode: chatMode,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
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

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
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
        status: 'Published',
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
        status: 'Draft',
      });
      toast.success('Draft saved successfully');
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
        scheduledFor: date,
      });
      toast.success('Announcement scheduled successfully');
      setActiveDraft(null);
      fetchDrafts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule announcement');
    }
  };

  const handleRefine = (actionType) => {
    sendMessage(`Refine this announcement: ${actionType}`, actionType);
  };

  const handleEditChange = (updatedDraft) => {
    setActiveDraft(updatedDraft);
  };

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!historySearch.trim()) return conversations;
    const query = historySearch.toLowerCase().trim();
    return conversations.filter((c) => (c.title || '').toLowerCase().includes(query));
  }, [conversations, historySearch]);

  const activeModeConfig = useMemo(() => {
    return CHAT_MODES.find((m) => m.id === chatMode) || CHAT_MODES[0];
  }, [chatMode]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-b-surface1 border-t md:border-l border-s-subtle select-text">
      {/* ─── 1. COLLAPSIBLE INNER AI CHAT SIDEBAR (DESKTOP) ─────────────── */}
      <aside
        aria-label="AI Chat History"
        className={`hidden md:flex flex-col shrink-0 border-r border-s-subtle bg-b-surface1 transition-[width] duration-250 ease-out h-full overflow-hidden ${
          sidebarCollapsed ? 'w-20 items-center' : 'w-80 max-3xl:w-72'
        }`}
      >
        {/* Expanded Sidebar Header */}
        {!sidebarCollapsed ? (
          <div className="p-3.5 border-b border-s-subtle shrink-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sub-title-1 font-bold text-t-primary">
                  Conversations
                </span>
                <span className="px-2 py-0.5 rounded-full text-caption bg-b-surface2 text-t-secondary border border-s-subtle font-medium">
                  {conversations.length}
                </span>
              </div>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                aria-label="Collapse conversations sidebar"
                title="Collapse sidebar"
                className="flex items-center justify-center size-8 rounded-full bg-b-surface2 border border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight shadow-widget transition-all cursor-pointer"
              >
                <Icon name="chevron" className="!size-4 fill-current rotate-90" />
              </button>
            </div>

            {/* Expanded New Conversation Button with Text */}
            <button
              type="button"
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-3xl btn-primary text-button cursor-pointer transition-all shadow-widget active:scale-[0.99]"
              title="New Conversation"
              aria-label="New Conversation"
            >
              <svg
                style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px', display: 'block', flexShrink: 0 }}
                className="shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Conversation</span>
            </button>

            {/* Search Input */}
            <Search
              isGray
              className="w-full"
              placeholder="Search conversations..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>
        ) : (
          /* Collapsed Sidebar Rail (Desktop) */
          <div className="p-3 border-b border-s-subtle flex flex-col items-center gap-2.5 shrink-0">
            {/* Expand Button */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              aria-label="Expand conversations sidebar"
              title="Expand sidebar"
              className="flex items-center justify-center size-10 rounded-full bg-b-surface2 border border-s-subtle text-t-secondary hover:text-t-primary hover:border-s-highlight shadow-widget transition-all cursor-pointer shrink-0"
            >
              <Icon name="chevron" className="!size-4 fill-current -rotate-90 shrink-0" />
            </button>

            {/* Collapsed New Conversation: ONLY '+' icon with Tooltip */}
            <button
              type="button"
              onClick={startNewChat}
              aria-label="New Conversation"
              title="New Conversation"
              className="flex items-center justify-center size-11 !p-0 !min-h-0 rounded-full btn-primary cursor-pointer transition-all shadow-widget active:scale-95 hover:brightness-110 shrink-0"
            >
              <svg
                style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', display: 'block', flexShrink: 0 }}
                className="shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}

        {/* Conversation List (Independent Internal Scrolling) */}
        <div
          className={`flex-1 overflow-y-auto scrollbar-thin ${
            sidebarCollapsed ? 'p-2 space-y-2' : 'p-2.5 space-y-1'
          }`}
        >
          {filteredConversations.length === 0 ? (
            !sidebarCollapsed && (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-b-surface2 border border-s-subtle flex items-center justify-center text-t-secondary">
                  <Icon name="chat" className="!size-5 fill-current" />
                </div>
                <p className="text-caption text-t-tertiary">
                  {historySearch ? 'No matching conversations' : 'No previous conversations'}
                </p>
              </div>
            )
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConv?._id === conv._id;
              const isReport = conv.metadata?.mode === 'report';
              const isAnnounce = conv.metadata?.mode === 'announcement';

              const modeIcon = isReport
                ? 'document-text'
                : isAnnounce
                  ? 'speakerphone'
                  : 'chat-think';

              const modeColor = isReport
                ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10'
                : isAnnounce
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                  : 'text-primary-01 bg-primary-01/10';

              if (sidebarCollapsed) {
                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => loadConversation(conv._id)}
                    title={conv.title || 'Untitled Conversation'}
                    aria-label={conv.title || 'Conversation'}
                    className={`group relative flex items-center justify-center size-11 rounded-2xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-b-surface2 border border-s-stroke2 shadow-widget text-t-primary'
                        : 'text-t-secondary hover:text-t-primary hover:bg-b-surface2/60 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                        style={{ background: 'var(--accent, var(--primary-01))' }}
                      />
                    )}
                    <Icon name={modeIcon} className="!size-5 fill-current" />
                  </button>
                );
              }

              return (
                <div
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadConversation(conv._id);
                  }}
                  className={`group relative flex items-center justify-between gap-2.5 p-2.5 rounded-2xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-b-surface2 border border-s-stroke2 shadow-widget text-t-primary font-semibold'
                      : 'text-t-secondary hover:text-t-primary hover:bg-b-surface2/60 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full"
                      style={{ background: 'var(--accent, var(--primary-01))' }}
                    />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`flex items-center justify-center size-8 rounded-xl shrink-0 ${modeColor}`}
                    >
                      <Icon name={modeIcon} className="!size-4 fill-current" />
                    </span>
                    <span className="truncate text-body-2 leading-tight">
                      {conv.title || 'Untitled Conversation'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => deleteConv(conv._id, e)}
                    aria-label="Delete conversation"
                    title="Delete Conversation"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-t-tertiary hover:text-primary-03 hover:bg-primary-03/10 transition-all cursor-pointer shrink-0"
                  >
                    <Icon name="trash" className="!size-4 fill-current" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ─── MOBILE DRAWER (TABLET & PHONE) ─────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-b-surface1/75 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs h-full bg-b-surface1 border-r border-s-subtle shadow-2xl flex flex-col z-10 animate-slide-right">
            <div className="p-4 border-b border-s-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sub-title-1 font-bold text-t-primary">Chat History</span>
                <span className="px-2 py-0.5 rounded-full text-caption bg-b-surface2 text-t-secondary border border-s-subtle">
                  {conversations.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center justify-center size-9 rounded-full bg-b-surface2 text-t-secondary hover:text-t-primary border border-s-subtle"
                aria-label="Close sidebar"
              >
                <Icon name="close" className="!size-4.5 fill-current" />
              </button>
            </div>

            <div className="p-3 border-b border-s-subtle space-y-2">
              <button
                type="button"
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-3xl btn-primary text-button cursor-pointer"
              >
                <Icon name="plus" className="!size-4.5 fill-current" />
                <span>New Conversation</span>
              </button>
              <Search
                isGray
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl text-body-2 cursor-pointer transition-all ${
                    activeConv?._id === conv._id
                      ? 'bg-b-surface2 border border-s-stroke2 text-t-primary font-semibold'
                      : 'text-t-secondary hover:text-t-primary hover:bg-b-surface2/60'
                  }`}
                >
                  <span className="truncate flex-1">{conv.title || 'Untitled Chat'}</span>
                  <button
                    type="button"
                    onClick={(e) => deleteConv(conv._id, e)}
                    className="p-1 text-t-tertiary hover:text-primary-03"
                  >
                    <Icon name="trash" className="!size-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. MAIN CHAT WORKSPACE AREA ────────────────────────────────── */}
      <section className="flex-1 flex flex-col min-w-0 bg-b-surface1 h-full overflow-hidden">
        {/* ── MAIN HEADER (Requirement 3 & 4: Zero Duplicate Actions) ── */}
        <header className="px-5 py-3.5 max-md:px-3 border-b border-s-subtle bg-b-surface1/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile History Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open conversation history"
              className="md:hidden flex items-center justify-center size-10 rounded-full bg-b-surface2 border border-s-subtle text-t-secondary hover:text-t-primary shadow-widget cursor-pointer shrink-0"
            >
              <Icon name="clock" className="!size-5 fill-current" />
            </button>

            {/* Colleges Hub AI Reports Heading & Subtitle */}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-h6 max-md:text-sub-title-1 font-bold text-t-primary tracking-tight truncate">
                  Colleges Hub AI Reports
                </h1>
                <span className="label label-blue !h-5 !px-2.5 !text-[10px] uppercase font-bold tracking-wider shrink-0">
                  Super Admin
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Engine Active
                </span>
              </div>
              <p className="text-caption text-t-secondary truncate max-w-2xl hidden sm:block mt-0.5">
                Super Admin AI intelligence workspace to generate reports, analyze college data, and access administrative insights.
              </p>
            </div>
          </div>
          {/* Header has zero duplicate buttons; New Session and Collapse exist inside the AI sidebar */}
        </header>

        {/* ── 3. CONVERSATION MESSAGE STREAM (Independently Scrollable) ──── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin bg-b-surface2/40">
          {messages.length === 0 ? (
            /* Empty State Hero Card */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8 px-4 space-y-6">
              <div className="relative">
                <div
                  className="size-16 rounded-3xl flex items-center justify-center shadow-widget border border-s-stroke2 transition-all"
                  style={{
                    background:
                      chatMode === 'report'
                        ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(79, 70, 229, 0.15))'
                        : chatMode === 'announcement'
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))'
                          : 'linear-gradient(135deg, rgba(11, 77, 148, 0.15), rgba(61, 190, 99, 0.15))',
                  }}
                >
                  <Icon
                    name={activeModeConfig.icon}
                    className="!size-8 fill-[var(--accent,var(--primary-01))]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 max-w-lg">
                <h2 className="text-h5 max-md:text-h6 font-bold text-t-primary">
                  {chatMode === 'report'
                    ? 'AI Executive Report Studio'
                    : chatMode === 'announcement'
                      ? 'Cross-Campus Announcement Studio'
                      : 'Super Admin Operational Intelligence'}
                </h2>
                <p className="text-body-2 text-t-secondary leading-relaxed">
                  {chatMode === 'report'
                    ? 'Request comparative college audits, enrollment breakdowns, and platform financial summaries. Generates high-resolution branded PDF reports.'
                    : chatMode === 'announcement'
                      ? 'Draft formal policy notices, scheduled campus advisories, and administrative circulars for all affiliated colleges.'
                      : 'Query real-time platform statistics, college performance metrics, system activity logs, or administrative policies across all institutions.'}
                </p>
              </div>

              {/* Suggested Quick Prompt Chips */}
              <div className="w-full pt-2">
                <p className="text-caption font-semibold text-t-tertiary uppercase tracking-wider mb-3">
                  Suggested Prompts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                  {(SUGGESTED_PROMPTS[chatMode] || SUGGESTED_PROMPTS.chat).map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInput(chip.prompt);
                        if (inputRef.current) {
                          inputRef.current.style.height = 'auto';
                          inputRef.current.focus();
                        }
                      }}
                      className="group p-3 rounded-2xl bg-b-surface2 border border-s-subtle hover:border-s-highlight hover:shadow-widget transition-all cursor-pointer text-left flex flex-col justify-between"
                    >
                      <span className="text-caption font-bold text-t-primary group-hover:text-primary-01 transition-colors">
                        {chip.title}
                      </span>
                      <span className="text-[12px] text-t-secondary line-clamp-2 mt-1">
                        {chip.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start items-start'
                }`}
              >
                {/* Assistant Avatar */}
                {msg.role === 'assistant' && (
                  <div
                    className="size-9 rounded-2xl flex items-center justify-center shrink-0 shadow-widget mt-0.5 border border-s-stroke2"
                    style={{
                      background:
                        msg.mode === 'report'
                          ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                          : msg.mode === 'announcement'
                            ? 'linear-gradient(135deg, #D97706, #B45309)'
                            : 'linear-gradient(135deg, #0B4D94, #3DBE63)',
                      color: '#ffffff',
                    }}
                  >
                    <Icon
                      name={
                        msg.mode === 'report'
                          ? 'document-text'
                          : msg.mode === 'announcement'
                            ? 'speakerphone'
                            : 'chat-think'
                      }
                      className="!size-4.5 fill-current"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-primary-01 text-t-light rounded-3xl rounded-br-md px-5 py-3 shadow-widget text-body-2 leading-relaxed'
                      : 'w-full space-y-2'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.mode === 'report' && msg.report ? (
                    /* ── Branded Executive PDF Report Card ── */
                    <div className="p-5 rounded-3xl bg-b-surface2 border border-s-stroke2 shadow-widget space-y-4 max-w-2xl">
                      <div className="flex items-start gap-3.5">
                        <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <Icon name="document-text" className="!size-6 fill-current" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Executive PDF Report
                            </span>
                            {msg.report.generatedAt && (
                              <span className="text-[11px] text-t-tertiary">
                                {new Date(msg.report.generatedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sub-title-1 font-bold text-t-primary tracking-tight">
                            {msg.report.title}
                          </h3>
                          {msg.report.subtitle && (
                            <p className="text-caption text-t-secondary">{msg.report.subtitle}</p>
                          )}
                        </div>
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-s-subtle text-caption">
                        <span className="px-2.5 py-1 rounded-xl bg-b-surface1 text-t-secondary border border-s-subtle font-medium">
                          Sections: {msg.report.sectionsCount || 3}
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-b-surface1 text-t-secondary border border-s-subtle font-medium">
                          Pages: {msg.report.pageCount || 1}
                        </span>
                        {msg.report.token && (
                          <span className="px-2.5 py-1 rounded-xl bg-b-surface1 text-t-tertiary border border-s-subtle font-mono text-[11px]">
                            Token: {msg.report.token.substring(0, 8)}...
                          </span>
                        )}
                      </div>

                      {/* Download & Preview Actions */}
                      <div className="flex items-center gap-2.5 pt-2">
                        <Button
                          isWhite
                          size="sm"
                          icon="eye"
                          onClick={() => window.open(msg.report.previewUrl, '_blank')}
                          className="flex-1"
                        >
                          Preview PDF
                        </Button>
                        <Button
                          isPrimary
                          size="sm"
                          icon="download"
                          as="a"
                          href={msg.report.downloadUrl}
                          download
                          className="flex-1"
                        >
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ) : msg.mode === 'announcement' && msg.announcement ? (
                    /* ── Announcement Card with Draft / Publish Actions ── */
                    <AnnouncementCard
                      announcement={msg.announcement}
                      mode="preview"
                      onPublish={handlePublishClick}
                      onSaveDraft={handleSaveDraft}
                      onSchedule={handleSchedule}
                      onRefine={handleRefine}
                      onEditChange={handleEditChange}
                      authorName={user?.name || 'Super Admin'}
                    />
                  ) : (
                    /* ── Standard Assistant Markdown Bubble ── */
                    <div className="p-4 sm:p-5 rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget text-body-2 text-t-primary leading-relaxed max-w-3xl space-y-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      <div className="pt-2 border-t border-s-subtle flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => copyText(msg.content, idx)}
                          className="flex items-center gap-1.5 text-caption text-t-tertiary hover:text-t-primary transition-colors cursor-pointer"
                        >
                          <Icon
                            name={copiedIndex === idx ? 'check' : 'copy'}
                            className="!size-3.5 fill-current"
                          />
                          <span>{copiedIndex === idx ? 'Copied' : 'Copy response'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Real-time Streaming Progress Banner */}
          {streaming && streamStage && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-b-surface2 border border-s-stroke2 shadow-widget animate-pulse max-w-md">
              <span
                className="size-2.5 rounded-full animate-ping shrink-0"
                style={{ background: 'var(--accent, var(--primary-01))' }}
              />
              <p className="text-caption font-semibold text-t-primary truncate">
                {streamStage}
              </p>
            </div>
          )}

          {/* Live text streaming */}
          {streaming && streamText && (
            <div className="flex items-start gap-3.5">
              <div className="size-9 rounded-2xl flex items-center justify-center shrink-0 shadow-widget bg-b-surface2 border border-s-stroke2 text-primary-01">
                <Icon name="sparkles" className="!size-4.5 fill-current animate-spin" />
              </div>
              <div className="p-4 sm:p-5 rounded-3xl bg-b-surface2 border border-s-subtle shadow-widget text-body-2 text-t-primary leading-relaxed max-w-3xl flex-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── 4. REDESIGNED MESSAGE COMPOSER (Requirement 5: Dropdown Inside Composer) ── */}
        <footer className="p-3 sm:p-4 border-t border-s-subtle bg-b-surface1 shrink-0 relative overflow-visible">
          <div className="max-w-4xl mx-auto relative">
            {/* Input Composer Box: [ Mode Icon + Dropdown ] [ Textarea ] [ Send Icon ] */}
            <div className="relative flex items-end gap-2 p-1.5 sm:p-2 rounded-3xl border border-s-stroke2 bg-b-surface2 focus-within:border-s-focus focus-within:shadow-input-typing transition-all shadow-widget">
              
              {/* ── A. Mode Dropdown Selector (Drop-up) ── */}
              <div ref={modeDropdownRef} className="relative shrink-0 self-end mb-0.5 sm:mb-1">
                <button
                  type="button"
                  onClick={() => setModeDropdownOpen((prev) => !prev)}
                  aria-expanded={modeDropdownOpen}
                  aria-haspopup="listbox"
                  title="Switch AI mode"
                  className="flex items-center gap-1.5 h-10 px-3 rounded-2xl bg-b-surface1 hover:bg-b-highlight border border-s-subtle text-t-primary text-caption font-semibold transition-all cursor-pointer shadow-xs select-none"
                >
                  <Icon
                    name={activeModeConfig.icon}
                    className={`!size-4.5 fill-current shrink-0 ${
                      chatMode === 'report'
                        ? 'text-purple-600 dark:text-purple-400'
                        : chatMode === 'announcement'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-primary-01'
                    }`}
                  />
                  <span className="hidden sm:inline-block max-w-[110px] truncate">
                    {activeModeConfig.shortLabel}
                  </span>
                  <svg
                    style={{ width: '12px', height: '12px', display: 'block', flexShrink: 0 }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 transition-transform duration-200 text-t-tertiary ${
                      modeDropdownOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Drop-up Menu */}
                {modeDropdownOpen && (
                  <div
                    role="listbox"
                    aria-label="Available Chat Modes"
                    className="absolute bottom-full mb-2.5 left-0 z-50 w-76 p-2 rounded-2xl bg-b-surface2 border border-s-subtle shadow-dropdown animate-slide-up"
                  >
                    <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold text-t-tertiary">
                      Select AI Engine Mode
                    </div>
                    <div className="space-y-1 mt-1">
                      {CHAT_MODES.map((mode) => {
                        const isSelected = chatMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setChatMode(mode.id);
                              setModeDropdownOpen(false);
                              inputRef.current?.focus();
                            }}
                            className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-b-surface1 border border-s-stroke2 shadow-xs'
                                : 'hover:bg-b-surface1/60 border border-transparent'
                            }`}
                          >
                            <span
                              className={`flex items-center justify-center size-8 rounded-xl shrink-0 ${
                                mode.id === 'report'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : mode.id === 'announcement'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-primary-01/10 text-primary-01'
                              }`}
                            >
                              <Icon name={mode.icon} className="!size-4 fill-current" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-caption font-bold text-t-primary truncate">
                                {mode.label}
                              </p>
                              <p className="text-[11px] text-t-tertiary truncate">
                                {mode.description}
                              </p>
                            </div>
                            {isSelected && (
                              <Icon
                                name="check"
                                className="!size-4 text-primary-01 fill-primary-01 shrink-0 ml-1"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── B. Expandable Textarea ── */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={activeModeConfig.placeholder}
                rows={1}
                disabled={streaming || inputDisabled}
                className="flex-1 min-w-0 bg-transparent px-2.5 py-2 text-body-2 text-t-primary placeholder:text-t-tertiary outline-none resize-none min-h-[40px] max-h-[120px] self-end mb-0.5 sm:mb-1 scrollbar-thin"
              />

              {/* ── C. Robust SVG Send Icon (Requirements 1 & 2) ── */}
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={streaming || inputDisabled || !input.trim()}
                aria-label={streaming ? 'Generating response...' : 'Send prompt'}
                title={
                  streaming
                    ? 'Generating response...'
                    : input.trim()
                      ? 'Send Prompt (Enter)'
                      : 'Enter prompt to send'
                }
                className={`shrink-0 z-10 flex items-center justify-center size-10 !p-0 !min-h-0 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-01 self-end mb-0.5 sm:mb-1 ${
                  streaming
                    ? 'btn-primary cursor-wait opacity-85 shadow-widget'
                    : !input.trim() || inputDisabled
                      ? 'opacity-40 cursor-not-allowed bg-b-surface1 text-t-tertiary border border-s-subtle shadow-xs'
                      : 'btn-primary active:scale-95 shadow-widget hover:brightness-110 cursor-pointer'
                }`}
              >
                {streaming ? (
                  <svg
                    style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px', display: 'block', flexShrink: 0 }}
                    className="animate-spin shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px', display: 'block', flexShrink: 0 }}
                    className="shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Subtle bottom keyboard guide */}
            <div className="flex items-center justify-between text-[11px] text-t-tertiary pt-1.5 px-2">
              <span className="truncate">
                Mode: <strong className="text-t-primary font-semibold">{activeModeConfig.label}</strong>
              </span>
              <span className="hidden sm:inline-block">
                <kbd className="px-1.5 py-0.5 rounded bg-b-surface2 border border-s-subtle font-mono text-[10px]">
                  Enter
                </kbd>{' '}
                send •{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-b-surface2 border border-s-subtle font-mono text-[10px]">
                  Shift + Enter
                </kbd>{' '}
                line
              </span>
            </div>
          </div>
        </footer>
      </section>

      {/* Announcement Publish Confirmation Modal */}
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

export default SuperAdminAIChatView;
