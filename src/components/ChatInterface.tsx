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
  X,
  Menu,
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

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [expandedSources, setExpandedSources] = useState<number | null>(null)

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

  return (
    <div className="relative flex h-screen">
      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="glass sticky top-0 z-20 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo mark */}
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

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-tertiary hover:text-ink hover:bg-surface-tertiary/50 transition-all duration-200"
            >
              {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Sources</span>
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
                  {/* Icon */}
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

                  {/* Suggestion chips */}
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

                {/* Input form (empty state) */}
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

                      {/* Source attribution */}
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

              {/* Streaming message */}
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

              {/* Typing indicator */}
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

      {/* Document sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 border-l border-surface-tertiary/50 overflow-hidden flex-shrink-0"
            style={{ background: 'rgba(10, 14, 20, 0.95)' }}
          >
            <div className="w-[300px] h-full overflow-y-auto p-4">
              <h3 className="font-sans font-semibold text-ink text-sm mb-4 uppercase tracking-wider">
                Indexed Documents
              </h3>
              <div className="space-y-1.5">
                {INDEXED_DOCUMENTS.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-surface-tertiary/30 transition-colors group"
                  >
                    {doc.type === 'spreadsheet' ? (
                      <Table2 className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-accent/70 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-ink-secondary group-hover:text-ink transition-colors truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-ink-muted font-mono">
                        {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-surface-tertiary/50">
                <p className="text-xs text-ink-muted font-mono text-center">
                  {totalChunks} total chunks indexed
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
