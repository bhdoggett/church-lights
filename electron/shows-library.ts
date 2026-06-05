import { join } from 'path'
import { readdirSync, writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync, statSync } from 'fs'
import { app } from 'electron'
import type { Config } from '../src/shared/types'

function getShowsDir(): string {
  return join(app.getPath('documents'), 'Church Lights')
}

export interface ShowInfo {
  name: string
  modifiedAt: number  // ms timestamp
}

function ensureDir(): string {
  const dir = getShowsDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function showPath(name: string): string {
  return join(getShowsDir(), `${name}.json`)
}

export function listShows(): ShowInfo[] {
  const dir = ensureDir()
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      name: f.replace(/\.json$/, ''),
      modifiedAt: statSync(join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.modifiedAt - a.modifiedAt) // newest first
}

export function saveNamedShow(name: string, config: Config): void {
  ensureDir()
  writeFileSync(showPath(name), JSON.stringify(config, null, 2), 'utf-8')
}

export function loadNamedShow(name: string): Config {
  const raw = JSON.parse(readFileSync(showPath(name), 'utf-8'))
  if (!Array.isArray(raw.fixtures) || !Array.isArray(raw.scenes)) {
    throw new Error('Invalid show file format')
  }
  return { groups: [], ...raw } as Config
}

export function deleteNamedShow(name: string): void {
  unlinkSync(showPath(name))
}
