'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  FileText,
  Table2,
  ChevronDown,
  ChevronRight,
  Database,
  MessageSquare,
  BarChart3,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { Message, Source } from '@/types'

const SUGGESTION_CHIPS = [
  'What are the EVRlock QB2 running procedures?',
  'Show me EB performance data for 7" casing',
  'What torque values for QB1-HT?',
  'Heavy wall vs light wall compatibility?',
]

// Document index for sidebar
const INDEXED_DOCUMENTS = [
  { name: 'EVRlock EB Running Procedure', type: 'document' as const, chunks: 8 },
  { name: 'EVRlock EB Gen2 Running Procedure', type: 'document' as const, chunks: 8 },
  { name: 'EVRlock QB2 Running Procedure', type: 'document' as const, chunks: 7 },
  { name: 'EVRlock QB1-HT Running Procedure', type: 'document' as const, chunks: 7 },
  { name: 'EB Gen2 Coupling Dimensions', type: 'document' as const, chunks: 2 },
  { name: 'QB2 Coupling Dimensions', type: 'document' as const, chunks: 2 },
  { name: 'QB2 TWCCEP Qualification', type: 'document' as const, chunks: 6 },
  { name: 'QB2 Thermal Compression Test', type: 'document' as const, chunks: 6 },
  { name: 'Technical Bulletin — HW/LW Compatibility', type: 'document' as const, chunks: 4 },
  { name: 'Technical Bulletin — Making-Up Accessories', type: 'document' as const, chunks: 2 },
  { name: 'USC Compatibility Bulletin', type: 'document' as const, chunks: 2 },
  { name: 'QB2 Field Bulletin — Stabbing Guide', type: 'document' as const, chunks: 2 },
  { name: 'QB2 Memorandum — Cross-Coupling', type: 'document' as const, chunks: 2 },
  { name: 'ENADATE HC L80 193.68mm BC+SCC', type: 'document' as const, chunks: 1 },
  { name: 'ENADATE MS P110 139.7mm EB', type: 'document' as const, chunks: 1 },
  { name: 'Performance Data — EB Gen2', type: 'spreadsheet' as const, chunks: 5 },
  { name: 'Performance Data — EB', type: 'spreadsheet' as const, chunks: 4 },
  { name: 'Performance Data — QB1-HT', type: 'spreadsheet' as const, chunks: 4 },
  { name: 'Performance Data — QB2', type: 'spreadsheet' as const, chunks: 4 },
  { name: 'Performance Data — QB2-XL', type: 'spreadsheet' as const, chunks: 4 },
]

const DOCUMENTS = INDEXED_DOCUMENTS.filter(d => d.type === 'document')
const SPREADSHEETS = INDEXED_DOCUMENTS.filter(d => d.type === 'spreadsheet')

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [expandedSources, setExpandedSources] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<'chat' | 'docs' | 'data'>('docs')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let sources: Source[] = []

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulated += parsed.content
                  setStreamingContent(accumulated)
                }
                if (parsed.sources) {
                  sources = parsed.sources
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: accumulated,
        sources,
      }
      setMessages(prev => [...prev, assistantMessage])
      setStreamingContent('')
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const totalChunks = INDEXED_DOCUMENTS.reduce((sum, d) => sum + d.chunks, 0)
  const hasMessages = messages.length > 0

  const sidebarNav = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'docs' as const, icon: FileText, label: 'Documents' },
    { id: 'data' as const, icon: BarChart3, label: 'Performance' },
  ]

  return (
    <div className="relative flex h-screen">
      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Header */}
        <header className="glass sticky top-0 z-20 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-sans font-bold text-white text-lg">
                EV
              </div>
              <div>
                <h1 className="font-sans font-semibold text-ink text-lg leading-tight">
                  EVRlock Knowledge Base
                </h1>
                <p className="font-mono text-xs text-ink-muted">
                  {totalChunks} chunks &middot; {INDEXED_DOCUMENTS.length} documents &middot; RAG-powered
                </p>
              </div>
            </div>

            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-tertiary hover:text-ink hover:bg-surface-tertiary/50 transition-all duration-200"
            >
              {sidebarExpanded ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto pb-4">
          {!hasMessages ? (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-180px)]">
              <div className="chat-container py-12 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center">
                    <Database className="w-8 h-8 text-accent" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-sans font-semibold text-ink mb-3">
                    EVRlock Technical Assistant
                  </h2>
                  <p className="text-ink-tertiary max-w-lg mx-auto mb-10 leading-relaxed">
                    Ask me anything about EVRlock premium OCTG connections — running procedures,
                    performance data, coupling dimensions, torque specs, and more.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-10">
                    {SUGGESTION_CHIPS.map((question, index) => (
                      <motion.button
                        key={question}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.08 }}
                        onClick={() => handleSend(question)}
                        className="suggestion-chip text-left"
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  onSubmit={handleSubmit}
                  className="max-w-2xl mx-auto relative"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about EVRlock connections..."
                    rows={1}
                    className="chat-input pr-14 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </motion.form>

                <p className="mt-6 text-xs text-ink-muted font-mono">
                  BM25 retrieval → Claude Sonnet → {totalChunks} indexed chunks
                </p>
              </div>
            </div>
          ) : (
            /* Message thread */
            <div className="chat-container py-6 space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[75%]`}>
                      <div
                        className={
                          message.role === 'user'
                            ? 'message-user px-5 py-3'
                            : 'message-assistant px-5 py-4'
                        }
                      >
                        {message.role === 'user' ? (
                          <p className="text-white">{message.content}</p>
                        ) : (
                          <div className="prose-chat">
                            <MarkdownRenderer content={message.content} />
                          </div>
                        )}
                      </div>

                      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                        <div className="mt-2 ml-1">
                          <button
                            onClick={() =>
                              setExpandedSources(expandedSources === index ? null : index)
                            }
                            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-tertiary transition-colors"
                          >
                            {expandedSources === index ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            <FileText className="w-3 h-3" />
                            {message.sources.length} sources
                          </button>

                          <AnimatePresence>
                            {expandedSources === index && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-2 space-y-2 overflow-hidden"
                              >
                                {message.sources.map((source, si) => (
                                  <div
                                    key={si}
                                    className="p-3 rounded-lg text-xs"
                                    style={{
                                      background: 'rgba(17, 24, 32, 0.6)',
                                      border: '1px solid rgba(100, 116, 139, 0.15)',
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-ink-secondary">
                                        {source.name}
                                      </span>
                                      <span className="font-mono text-ink-muted">
                                        p.{source.page} &middot; {source.score}
                                      </span>
                                    </div>
                                    <p className="text-ink-muted leading-relaxed">
                                      {source.snippet}
                                    </p>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    <div className="message-assistant px-5 py-4">
                      <div className="prose-chat">
                        <MarkdownRenderer content={streamingContent} />
                        <span className="inline-block w-2 h-5 bg-accent animate-pulse ml-0.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {isLoading && !streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="message-assistant px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed input bar (when in chat mode) */}
        {hasMessages && (
          <div className="glass sticky bottom-0 z-20 px-4 sm:px-6 py-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? 'Thinking...' : 'Ask about EVRlock connections...'}
                disabled={isLoading}
                rows={1}
                className="chat-input pr-14 resize-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </form>
            <p className="text-center mt-2 text-xs text-ink-muted font-mono">
              BM25 retrieval → Claude Sonnet → {totalChunks} indexed chunks
            </p>
          </div>
        )}
      </div>

      {/* Glassmorphism sidebar — right side */}
      <motion.aside
        animate={{ width: sidebarExpanded ? 300 : 60 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="sidebar-glass relative z-10 flex-shrink-0 hidden sm:flex flex-col h-screen overflow-hidden"
      >
        {/* Gradient edge accent */}
        <div className="absolute left-0 top-0 bottom-0 w-px sidebar-edge-glow" />

        {/* Top — Brand / section indicator */}
        <div className="px-3 pt-5 pb-4">
          <AnimatePresence mode="wait">
            {sidebarExpanded ? (
              <motion.div
                key="expanded-brand"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 px-1"
              >
                <Database className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="font-sans font-semibold text-ink text-sm whitespace-nowrap">
                  Source Index
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-brand"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex justify-center"
              >
                <Database className="w-5 h-5 text-accent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav tabs */}
        <nav className="px-2 space-y-1">
          {sidebarNav.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`sidebar-nav-item w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${
                  sidebarExpanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
                } ${
                  isActive
                    ? 'sidebar-nav-active text-ink'
                    : 'text-ink-muted hover:text-ink-secondary hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-sans whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Separator */}
        <div className="mx-3 my-3 h-px bg-white/[0.06]" />

        {/* Content area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
          <AnimatePresence mode="wait">
            {activeSection === 'chat' && (
              <motion.div
                key="chat-section"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                {sidebarExpanded ? (
                  <p className="px-2 py-3 text-xs text-ink-muted leading-relaxed">
                    {messages.length === 0
                      ? 'Start a conversation to see your chat history here.'
                      : `${messages.length} messages in this session.`}
                  </p>
                ) : (
                  <div className="flex justify-center py-3">
                    <span className="text-xs font-mono text-ink-muted">{messages.length}</span>
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'docs' && (
              <motion.div
                key="docs-section"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                {DOCUMENTS.map((doc, i) => (
                  <div
                    key={i}
                    className={`sidebar-doc-item flex items-start rounded-lg transition-all duration-200 group ${
                      sidebarExpanded ? 'gap-2.5 px-2.5 py-2' : 'justify-center px-0 py-2'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-accent/60 group-hover:text-accent mt-0.5 flex-shrink-0 transition-colors" />
                    {sidebarExpanded && (
                      <div className="min-w-0">
                        <p className="text-[13px] text-ink-secondary group-hover:text-ink transition-colors truncate leading-snug">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-ink-muted font-mono mt-0.5">
                          {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeSection === 'data' && (
              <motion.div
                key="data-section"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                {SPREADSHEETS.map((doc, i) => (
                  <div
                    key={i}
                    className={`sidebar-doc-item flex items-start rounded-lg transition-all duration-200 group ${
                      sidebarExpanded ? 'gap-2.5 px-2.5 py-2' : 'justify-center px-0 py-2'
                    }`}
                  >
                    <Table2 className="w-4 h-4 text-emerald-400/60 group-hover:text-emerald-400 mt-0.5 flex-shrink-0 transition-colors" />
                    {sidebarExpanded && (
                      <div className="min-w-0">
                        <p className="text-[13px] text-ink-secondary group-hover:text-ink transition-colors truncate leading-snug">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-ink-muted font-mono mt-0.5">
                          {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom — Status + collapse toggle */}
        <div className="mt-auto px-2 pb-4 pt-2 space-y-2">
          <div className="mx-1 h-px bg-white/[0.06]" />

          {sidebarExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 py-1.5"
            >
              <p className="text-[11px] text-ink-muted font-mono leading-relaxed">
                {totalChunks} chunks &middot; {INDEXED_DOCUMENTS.length} docs
              </p>
            </motion.div>
          )}

          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-white/[0.04] transition-all duration-200"
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarExpanded ? (
              <>
                <PanelRightClose className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </motion.aside>
    </div>
  )
}
