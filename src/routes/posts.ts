import { Router } from 'express'
import { supabase } from '../lib/supabase.ts'

export const postsRouter = Router()

postsRouter.get('/', async (_request, response) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    response.status(500).json({ error: error.message })
    return
  }

  response.json(data ?? [])
})
