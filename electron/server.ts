import express from 'express'
import type { Express } from 'express'
import type { Scene } from '../src/shared/types'

export function createCompanionServer(
  getScenes: () => Scene[],
  onActivate: (sceneId: string) => void
): Express {
  const app = express()
  app.use(express.json())

  app.get('/scenes', (_req, res) => {
    const scenes = getScenes().map(({ id, name }) => ({ id, name }))
    res.json(scenes)
  })

  app.post('/scenes/:id/activate', (req, res) => {
    const scene = getScenes().find((s) => s.id === req.params.id)
    if (!scene) {
      res.status(404).json({ error: 'Scene not found' })
      return
    }
    onActivate(req.params.id)
    res.json({ ok: true })
  })

  app.get('/status', (_req, res) => {
    res.json({ status: 'ok' })
  })

  return app
}
