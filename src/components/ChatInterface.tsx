'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  FileText,
  Table2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Database,
  BookOpen,
  Printer,
  X,
  MessageSquarePlus,
  ArrowRight,
  User,
} from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { Message, Source } from '@/types'

const SUGGESTION_CHIPS = [
  'What are the EVRlock QB2 running procedures?',
  'Show me EB performance data for 7" casing',
  'What torque values for QB1-HT?',
  'Heavy wall vs light wall compatibility?',
]

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

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [bottomPaneOpen, setBottomPaneOpen] = useState(false)
  const [expandedSources, setExpandedSources] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

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
    setBottomPaneOpen(false)

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

  const handleNewChat = () => {
    setMessages([])
    setStreamingContent('')
    setInput('')
    setExpandedSources(null)
    setBottomPaneOpen(false)
  }

  const totalChunks = INDEXED_DOCUMENTS.reduce((sum, d) => sum + d.chunks, 0)
  const hasMessages = messages.length > 0

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Breathing gradient background */}
      <div className="breathing-gradient" />

      {/* ─── Header ─── */}
      <header className="h-[100px] flex-shrink-0">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo with wordmark */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleNewChat}
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Return to home"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <span className="font-display text-2xl font-medium text-accent">P</span>
            </div>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="font-display text-2xl sm:text-3xl font-medium text-ink tracking-tight leading-tight">
                PROLock
              </span>
              <span className="font-sans text-sm text-accent">
                Connection Knowledge Base
              </span>
            </div>
          </motion.button>

          {/* Right-side controls */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {hasMessages && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleNewChat}
                className="p-2 rounded-full hover:bg-[var(--surface-secondary)] transition-colors"
                aria-label="New chat"
              >
                <MessageSquarePlus className="w-5 h-5 text-[var(--ink)]" />
              </motion.button>
            )}
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded-full hover:bg-[var(--surface-secondary)] transition-colors"
              aria-label="Resources"
            >
              <BookOpen className="w-5 h-5 text-[var(--ink)]" />
            </button>
          </motion.div>
        </div>
      </header>

      {/* ─── Content Area ─── */}
      <div className="flex-1 relative overflow-hidden">
        {/* ── Top Pane ── */}
        <motion.div
          className="absolute inset-0 flex flex-col"
          animate={{ y: bottomPaneOpen ? '-50%' : '0%' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex-1 overflow-hidden flex flex-col">
            {!hasMessages ? (
              /* ── Welcome Screen — single column centered (portfolio style) ── */
              <div className="flex-1 overflow-y-auto">
                <div className="w-full max-w-3xl mx-auto px-6 py-12 sm:py-16">
                  {/* Headline */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-center mb-10"
                  >
                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-[var(--ink)] mb-6 tracking-tight">
                      Your connection data.{' '}
                      <span className="text-[var(--accent)]">Answered instantly.</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--ink-secondary)] max-w-2xl mx-auto leading-relaxed">
                      AI-powered technical assistant for EVRlock premium OCTG
                      connections — running procedures, performance data, torque
                      specs, and more.
                    </p>
                  </motion.div>

                  {/* Input field */}
                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="relative max-w-2xl mx-auto mb-10"
                  >
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about PROLock connections..."
                      rows={1}
                      className="chat-input pr-14 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="group absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-[var(--accent)] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                      aria-label="Send message"
                    >
                      <Send className="w-5 h-5 text-white group-hover:text-[var(--accent)] transition-colors duration-200" />
                    </button>
                  </motion.form>

                  {/* Suggested questions — 2x2 grid with flow-button style */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="max-w-2xl mx-auto"
                  >
                    <p className="text-sm text-[var(--ink-tertiary)] mb-4 text-center">
                      Or try one of these:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SUGGESTION_CHIPS.map((question, index) => (
                        <motion.button
                          key={question}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                          onClick={() => handleSend(question)}
                          className="suggestion-btn text-left"
                        >
                          {/* Left arrow — slides in on hover */}
                          <ArrowRight
                            className="absolute w-3.5 h-3.5 left-[-25%] stroke-[var(--ink)] fill-none z-[9] group-hover:left-3 group-hover:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                          />
                          {/* Text content */}
                          <span className="relative z-[1] -translate-x-2 group-hover:translate-x-2 transition-all duration-[800ms] ease-out text-left">
                            {question}
                          </span>
                          {/* Expanding background */}
                          <span className="absolute inset-0 bg-[var(--accent)] rounded-full opacity-0 scale-0 group-hover:scale-100 group-hover:opacity-100 group-hover:rounded-xl transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]" />
                          {/* Right arrow — slides out on hover */}
                          <ArrowRight
                            className="absolute w-3.5 h-3.5 right-3 stroke-[var(--ink)] fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                          />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Footer stats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-16 text-center"
                  >
                    <p className="text-sm text-[var(--ink-muted)]">
                      {totalChunks} indexed chunks &middot; {INDEXED_DOCUMENTS.length} documents &middot; BM25 + Claude
                    </p>
                  </motion.div>
                </div>
              </div>
            ) : (
              /* ── Active Chat ── */
              <>
                <div className="flex-1 overflow-y-auto pb-4 min-h-0">
                  <div className="chat-container py-6 space-y-6">
                    <AnimatePresence mode="popLayout">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {/* Assistant avatar */}
                          {message.role === 'assistant' && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                                <span className="font-display text-sm font-medium text-accent">P</span>
                              </div>
                            </div>
                          )}

                          <div className={`flex-1 max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                            <div
                              className={
                                message.role === 'user'
                                  ? 'message-user px-5 py-3'
                                  : 'message-assistant'
                              }
                            >
                              {message.role === 'user' ? (
                                <p className="text-ink">{message.content}</p>
                              ) : (
                                <div className="prose-chat">
                                  <MarkdownRenderer content={message.content} />
                                </div>
                              )}
                            </div>

                            {/* Sources */}
                            {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                              <div className="mt-3">
                                <button
                                  onClick={() =>
                                    setExpandedSources(expandedSources === index ? null : index)
                                  }
                                  className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-accent transition-colors"
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
                                          className="p-3 rounded-xl text-xs bg-surface-secondary"
                                          style={{
                                            border: '1px solid color-mix(in srgb, var(--ink-muted) 20%, transparent)',
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

                          {/* User avatar */}
                          {message.role === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center">
                              <User className="w-4 h-4 text-ink-tertiary" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Streaming message */}
                    {streamingContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 justify-start"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                            <span className="font-display text-sm font-medium text-accent">P</span>
                          </div>
                        </div>
                        <div className="flex-1 max-w-[85%] sm:max-w-[75%]">
                          <div className="message-assistant">
                            <div className="prose-chat">
                              <MarkdownRenderer content={streamingContent} />
                              <span className="streaming-cursor" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Typing indicator */}
                    {isLoading && !streamingContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-4 justify-start"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                            <span className="font-display text-sm font-medium text-accent">P</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 py-3">
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input bar */}
                <div className="bg-[var(--surface)]">
                  <form onSubmit={handleSubmit} className="chat-container py-4">
                    <div className="relative">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isLoading ? 'Thinking...' : 'Ask about PROLock connections...'}
                        disabled={isLoading}
                        rows={1}
                        className="chat-input pr-14 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="group absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-[var(--accent)] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Send message"
                      >
                        <Send className="w-5 h-5 text-white group-hover:text-[var(--accent)] transition-colors duration-200" />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* View Specifications trigger */}
          <div className="flex-shrink-0 flex justify-center py-3">
            <button
              onClick={() => setBottomPaneOpen(true)}
              className="specs-trigger flex items-center gap-2 px-5 py-2 text-xs font-mono text-ink-muted hover:text-ink-secondary transition-all duration-200"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              View Specifications
            </button>
          </div>
        </motion.div>

        {/* ── Bottom Pane — Specifications ── */}
        <motion.div
          className="absolute left-0 right-0 bottom-0 z-20 bottom-pane"
          style={{ height: '65%' }}
          animate={{ y: bottomPaneOpen ? '0%' : '105%' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Handle / close bar */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <h2 className="font-display text-2xl font-medium text-ink tracking-tight">
              Connection Specifications
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-ink-tertiary hover:text-ink hover:bg-surface-secondary transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                onClick={() => setBottomPaneOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-ink-tertiary hover:text-ink hover:bg-surface-secondary transition-all"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>

          {/* Specs table */}
          <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(100% - 52px)' }}>
            <div className="max-w-5xl mx-auto">
              {/* Documents section */}
              <div className="mb-6">
                <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">
                  Technical Documents
                </h3>
                <table className="specs-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Document</th>
                      <th className="text-center w-24">Type</th>
                      <th className="text-center w-24">Chunks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INDEXED_DOCUMENTS.filter(d => d.type === 'document').map((doc, i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-accent/60 flex-shrink-0" />
                            <span>{doc.name}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-accent/10 text-accent">
                            PDF
                          </span>
                        </td>
                        <td className="text-center font-mono text-ink-muted">{doc.chunks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance data section */}
              <div>
                <h3 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">
                  Performance Data Sheets
                </h3>
                <table className="specs-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Data Set</th>
                      <th className="text-center w-24">Type</th>
                      <th className="text-center w-24">Chunks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INDEXED_DOCUMENTS.filter(d => d.type === 'spreadsheet').map((doc, i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Table2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                            <span>{doc.name}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-400/10 text-emerald-400">
                            XLSX
                          </span>
                        </td>
                        <td className="text-center font-mono text-ink-muted">{doc.chunks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid color-mix(in srgb, var(--ink-muted) 20%, transparent)' }}>
                <p className="text-xs text-ink-muted font-mono">
                  {INDEXED_DOCUMENTS.length} documents &middot; {totalChunks} total chunks indexed
                </p>
                <p className="text-xs text-ink-muted font-mono">
                  BM25 retrieval &middot; Claude Sonnet
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Resources Sidebar Overlay ─── */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />

            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[340px] sidebar-glass flex flex-col"
            >
              {/* Gradient edge */}
              <div className="absolute left-0 top-0 bottom-0 w-px sidebar-edge-glow" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-accent" />
                  <span className="font-display text-lg font-medium text-ink">
                    Source Index
                  </span>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-secondary transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mx-5 h-px" style={{ background: 'color-mix(in srgb, var(--ink-muted) 20%, transparent)' }} />

              {/* Document list */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-1">
                <p className="px-2 pb-2 text-[11px] font-mono text-ink-muted uppercase tracking-wider">
                  Documents
                </p>
                {INDEXED_DOCUMENTS.filter(d => d.type === 'document').map((doc, i) => (
                  <div
                    key={i}
                    className="sidebar-doc-item flex items-start gap-2.5 px-2.5 py-2 rounded-lg group"
                  >
                    <FileText className="w-4 h-4 text-accent/60 group-hover:text-accent mt-0.5 flex-shrink-0 transition-colors" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-ink-secondary group-hover:text-ink transition-colors truncate leading-snug">
                        {doc.name}
                      </p>
                      <p className="text-[11px] text-ink-muted font-mono mt-0.5">
                        {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="mx-2 my-3 h-px" style={{ background: 'color-mix(in srgb, var(--ink-muted) 20%, transparent)' }} />

                <p className="px-2 pb-2 text-[11px] font-mono text-ink-muted uppercase tracking-wider">
                  Performance Data
                </p>
                {INDEXED_DOCUMENTS.filter(d => d.type === 'spreadsheet').map((doc, i) => (
                  <div
                    key={i}
                    className="sidebar-doc-item flex items-start gap-2.5 px-2.5 py-2 rounded-lg group"
                  >
                    <Table2 className="w-4 h-4 text-emerald-400/60 group-hover:text-emerald-400 mt-0.5 flex-shrink-0 transition-colors" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-ink-secondary group-hover:text-ink transition-colors truncate leading-snug">
                        {doc.name}
                      </p>
                      <p className="text-[11px] text-ink-muted font-mono mt-0.5">
                        {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-4" style={{ borderTop: '1px solid color-mix(in srgb, var(--ink-muted) 20%, transparent)' }}>
                <p className="text-[11px] text-ink-muted font-mono text-center">
                  {totalChunks} chunks &middot; {INDEXED_DOCUMENTS.length} docs &middot; RAG-powered
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
