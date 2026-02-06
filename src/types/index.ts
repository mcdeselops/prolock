export interface KBChunk {
  id: string
  source: string
  title: string
  page: number | string
  type: 'document' | 'spreadsheet'
  content: string
  doc_name: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

export interface Source {
  name: string
  file: string
  page: number | string
  score: number
  snippet: string
}
