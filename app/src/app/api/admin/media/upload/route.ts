import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/current-user'
import { uploadMedia } from '@/lib/storage/r2'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function extensionFor(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension?.replace(/[^a-z0-9]/g, '') || 'bin'
}

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = String(formData.get('folder') || 'uploads')
      .toLowerCase()
      .replace(/[^a-z0-9/_-]/g, '-')
      .replace(/^\/+|\/+$/g, '')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo obrigatorio.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo nao permitido.' },
        { status: 415 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo excede o limite de 10 MB.' },
        { status: 413 }
      )
    }

    const date = new Date()
    const key = [
      folder || 'uploads',
      String(date.getUTCFullYear()),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      `${randomUUID()}.${extensionFor(file)}`,
    ].join('/')

    const url = await uploadMedia({
      key,
      contentType: file.type,
      body: new Uint8Array(await file.arrayBuffer()),
    })

    return NextResponse.json({ key, url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha no upload.'
    const status =
      message.includes('autenticado') || message.includes('administrador')
        ? 403
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}
