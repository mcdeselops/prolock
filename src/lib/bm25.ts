import type { KBChunk } from '@/types'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'it', 'its', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him',
  'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their', 'what',
  'which', 'who', 'whom', 'when', 'where', 'how', 'not', 'no', 'nor',
  'if', 'then', 'than', 'so', 'as', 'from', 'up', 'about', 'into',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.\-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t))
}

export interface BM25Index {
  df: Record<string, number>
  docTokens: { tf: Record<string, number>; len: number }[]
  N: number
  avgDl: number
}

export function buildIndex(docs: KBChunk[]): BM25Index {
  const df: Record<string, number> = {}
  const docTokens: { tf: Record<string, number>; len: number }[] = []
  let totalLen = 0

  for (const doc of docs) {
    const text = `${doc.doc_name} ${doc.title} ${doc.content}`
    const tokens = tokenize(text)
    const tf: Record<string, number> = {}
    const seen = new Set<string>()

    for (const token of tokens) {
      tf[token] = (tf[token] || 0) + 1
      if (!seen.has(token)) {
        df[token] = (df[token] || 0) + 1
        seen.add(token)
      }
    }

    docTokens.push({ tf, len: tokens.length })
    totalLen += tokens.length
  }

  return {
    df,
    docTokens,
    N: docs.length,
    avgDl: totalLen / docs.length,
  }
}

export function bm25Search(
  query: string,
  index: BM25Index,
  docs: KBChunk[],
  k = 10
): (KBChunk & { score: number })[] {
  const k1 = 1.5
  const b = 0.75
  const queryTokens = tokenize(query)
  const scores: { idx: number; score: number }[] = []

  for (let i = 0; i < index.N; i++) {
    const { tf, len } = index.docTokens[i]
    let score = 0

    for (const token of queryTokens) {
      const docFreq = index.df[token] || 0
      if (docFreq === 0) continue

      const idf = Math.log((index.N - docFreq + 0.5) / (docFreq + 0.5) + 1)
      const termFreq = tf[token] || 0
      const tfNorm = (termFreq * (k1 + 1)) / (termFreq + k1 * (1 - b + b * (len / index.avgDl)))
      score += idf * tfNorm
    }

    if (score > 0) {
      scores.push({ idx: i, score })
    }
  }

  scores.sort((a, b) => b.score - a.score)

  return scores.slice(0, k).map(({ idx, score }) => ({
    ...docs[idx],
    score,
  }))
}
