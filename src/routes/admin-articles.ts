import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { supabase } from '../lib/supabase.ts'
import { isAdminAuthenticated } from '../lib/admin-auth.ts'
import { isArticleStatus, slugify } from '../lib/articles.ts'

export const adminArticlesRouter = Router()

adminArticlesRouter.use((request, response, next) => {
  if (!isAdminAuthenticated(request)) {
    response.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
})

const ADMIN_COLUMNS =
  'id, slug, title_zh, title_en, description_zh, description_en, content_zh, content_en, cover_image_url, status, view_count, published_at, created_at, updated_at'

function toAdminArticle(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    titleZh: row.title_zh,
    titleEn: row.title_en,
    descriptionZh: row.description_zh,
    descriptionEn: row.description_en,
    contentZh: row.content_zh,
    contentEn: row.content_en,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    viewCount: row.view_count,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

adminArticlesRouter.get('/', async (_request, response) => {
  const { data, error } = await supabase
    .from('articles')
    .select(ADMIN_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  response.json((data ?? []).map(toAdminArticle))
})

adminArticlesRouter.get('/:id', async (request, response) => {
  const { data, error } = await supabase
    .from('articles')
    .select(ADMIN_COLUMNS)
    .eq('id', request.params.id)
    .single()

  if (error || !data) {
    response.status(404).json({ error: 'article not found' })
    return
  }

  response.json(toAdminArticle(data))
})

const EMPTY_DOC = { type: 'doc', content: [] }

type ArticleBody = {
  titleZh?: unknown
  titleEn?: unknown
  descriptionZh?: unknown
  descriptionEn?: unknown
  contentZh?: unknown
  contentEn?: unknown
  coverImageUrl?: unknown
  status?: unknown
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base
  let suffix = 2
  for (;;) {
    const { data } = await supabase.from('articles').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

adminArticlesRouter.post('/', async (request, response) => {
  const body = request.body as ArticleBody
  const titleZh = typeof body.titleZh === 'string' ? body.titleZh.trim() : ''
  const titleEn = typeof body.titleEn === 'string' ? body.titleEn.trim() : ''

  if (!titleZh) {
    response.status(400).json({ error: 'titleZh is required' })
    return
  }

  const slug = await uniqueSlug(slugify(titleZh))

  const { data, error } = await supabase
    .from('articles')
    .insert([
      {
        slug,
        title_zh: titleZh,
        title_en: titleEn || titleZh,
        content_zh: body.contentZh ?? EMPTY_DOC,
        content_en: body.contentEn ?? EMPTY_DOC,
        status: 'draft'
      }
    ])
    .select(ADMIN_COLUMNS)
    .single()

  if (error || !data) {
    response.status(500).json({ error: error?.message ?? 'failed to create article' })
    return
  }

  response.status(201).json(toAdminArticle(data))
})

adminArticlesRouter.patch('/:id', async (request, response) => {
  const body = request.body as ArticleBody
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.titleZh === 'string') update.title_zh = body.titleZh.trim()
  if (typeof body.titleEn === 'string') update.title_en = body.titleEn.trim()
  if (typeof body.descriptionZh === 'string') update.description_zh = body.descriptionZh.trim()
  if (typeof body.descriptionEn === 'string') update.description_en = body.descriptionEn.trim()
  if (body.contentZh !== undefined) update.content_zh = body.contentZh
  if (body.contentEn !== undefined) update.content_en = body.contentEn
  if (typeof body.coverImageUrl === 'string') update.cover_image_url = body.coverImageUrl

  if (body.status !== undefined) {
    if (!isArticleStatus(body.status)) {
      response.status(400).json({ error: 'invalid status' })
      return
    }
    update.status = body.status
    if (body.status === 'published') {
      const { data: existing } = await supabase
        .from('articles')
        .select('published_at')
        .eq('id', request.params.id)
        .single()
      if (!existing?.published_at) {
        update.published_at = new Date().toISOString()
      }
    }
  }

  const { data, error } = await supabase
    .from('articles')
    .update(update)
    .eq('id', request.params.id)
    .select(ADMIN_COLUMNS)
    .single()

  if (error || !data) {
    response.status(500).json({ error: error?.message ?? 'failed to update article' })
    return
  }

  response.json(toAdminArticle(data))
})

// "Delete" just archives — articles are never hard-deleted from the table.
adminArticlesRouter.delete('/:id', async (request, response) => {
  const { error } = await supabase
    .from('articles')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', request.params.id)

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  response.json({ success: true })
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })

adminArticlesRouter.post('/upload-image', upload.single('image'), async (request, response) => {
  const file = request.file
  if (!file) {
    response.status(400).json({ error: 'image file is required' })
    return
  }
  if (!file.mimetype.startsWith('image/')) {
    response.status(400).json({ error: 'file must be an image' })
    return
  }

  const ext = file.originalname.split('.').pop() ?? 'png'
  const path = `${randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('article-images')
    .upload(path, file.buffer, { contentType: file.mimetype })

  if (uploadError) {
    response.status(500).json({ error: uploadError.message })
    return
  }

  const { data } = supabase.storage.from('article-images').getPublicUrl(path)
  response.status(201).json({ url: data.publicUrl })
})
