import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get('file')
  if (!file || !file.endsWith('.pdf')) {
    return new Response('Not found', { status: 404 })
  }

  // Prevent path traversal
  const basename = path.basename(file)
  const filePath = path.join(process.cwd(), 'connections', basename)

  try {
    const buffer = await readFile(filePath)
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${basename}"`,
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
