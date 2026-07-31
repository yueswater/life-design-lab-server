import { Router } from 'express'
import { supabase } from '../lib/supabase.ts'
import { clientIp, hashIp } from '../lib/articles.ts'

export const articlesRouter = Router()

const PUBLIC_LIST_COLUMNS =
  'id, slug, title_zh, title_en, description_zh, description_en, cover_image_url, view_count, published_at'
const PUBLIC_DETAIL_COLUMNS =
  'id, slug, title_zh, title_en, description_zh, description_en, content_zh, content_en, cover_image_url, view_count, published_at'

articlesRouter.get('/', async (request, response) => {
  const limitParam = Number(request.query.limit)
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20

  const { data, error } = await supabase
    .from('articles')
    .select(PUBLIC_LIST_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  const articles = (data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    titleZh: a.title_zh,
    titleEn: a.title_en,
    descriptionZh: a.description_zh,
    descriptionEn: a.description_en,
    coverImageUrl: a.cover_image_url,
    viewCount: a.view_count,
    publishedAt: a.published_at
  }))

  response.json(articles)
})

articlesRouter.get('/:slug', async (request, response) => {
  const { slug } = request.params

  const { data, error } = await supabase
    .from('articles')
    .select(PUBLIC_DETAIL_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    response.status(404).json({ error: 'article not found' })
    return
  }

  response.json({
    id: data.id,
    slug: data.slug,
    titleZh: data.title_zh,
    titleEn: data.title_en,
    descriptionZh: data.description_zh,
    descriptionEn: data.description_en,
    contentZh: data.content_zh,
    contentEn: data.content_en,
    coverImageUrl: data.cover_image_url,
    viewCount: data.view_count,
    publishedAt: data.published_at
  })
})

// Only called client-side after the visitor has accepted analytics cookies —
// dedupes by (article, ip) so refreshing doesn't inflate the count.
articlesRouter.post('/:slug/view', async (request, response) => {
  const { slug } = request.params

  const { data: article, error: findError } = await supabase
    .from('articles')
    .select('id, view_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (findError || !article) {
    response.status(404).json({ error: 'article not found' })
    return
  }

  const ipHash = hashIp(clientIp(request))
  const { error: insertError } = await supabase
    .from('article_views')
    .insert([{ article_id: article.id, ip_hash: ipHash }])

  // Unique violation means this IP already viewed it — not an error, just a no-op.
  if (insertError && insertError.code !== '23505') {
    response.status(500).json({ error: insertError.message })
    return
  }

  if (!insertError) {
    await supabase
      .from('articles')
      .update({ view_count: (article.view_count ?? 0) + 1 })
      .eq('id', article.id)
  }

  response.json({ success: true })
})
