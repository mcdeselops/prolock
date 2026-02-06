import Anthropic from '@anthropic-ai/sdk'
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base'
import { buildIndex, bm25Search } from '@/lib/bm25'

// Build index once at module level (cached across warm serverless invocations)
const index = buildIndex(KNOWLEDGE_BASE)

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert technical assistant for EVRlock premium OCTG (Oil Country Tubular Goods) connections by EVRAZ North America. You answer questions based ONLY on the provided knowledge base context.

Key products include:
- EVRlock EB (and EB Gen2) — premium connection
- EVRlock QB2 — semi-premium connection
- EVRlock QB1-HT — high torque connection
- EVRlock QB2-XL — extended range

When answering:
- Be specific and cite which document/source the information comes from
- If the context doesn't contain enough info, say so clearly
- Use technical terminology appropriate for oilfield engineers
- Format data tables clearly when presenting numerical specs
- Be concise but thorough
- Use markdown formatting for readability`

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json()

    // BM25 search for relevant chunks
    const results = bm25Search(message, index, KNOWLEDGE_BASE, 10)

    // Build context string from retrieved chunks
    const context = results
      .map(
        (r, i) =>
          `[Source ${i + 1}: ${r.doc_name} | Page ${r.page}]\n${r.content}`
      )
      .join('\n\n---\n\n')

    // Build messages array (include recent history for continuity)
    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    if (history && history.length > 0) {
      const recent = history.slice(-8) // last 4 turn pairs
      messages.push(...recent)
    }
    messages.push({
      role: 'user',
      content: `KNOWLEDGE BASE CONTEXT:\n${context}\n\n---\n\nUSER QUESTION: ${message}\n\nAnswer based on the context above. Reference specific sources when possible.`,
    })

    // Stream response from Claude
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: SYSTEM_PROMPT,
            messages,
          })

          response.on('text', (text) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
            )
          })

          // Wait for full response to get final content
          const finalMessage = await response.finalMessage()
          const fullAnswer = finalMessage.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('')

          // Send sources at the end
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                sources: results.map((r) => ({
                  name: r.doc_name,
                  page: r.page,
                  score: Math.round(r.score * 100) / 100,
                  snippet: r.content.substring(0, 150) + '...',
                })),
                done: true,
              })}\n\n`
            )
          )
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: unknown) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
