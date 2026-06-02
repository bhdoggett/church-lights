import slugify from 'slugify'

export function makeSceneId(name: string, existingIds: string[]): string {
  const base = slugify(name, { lower: true, strict: true }) || 'scene'
  if (!existingIds.includes(base)) return base

  let n = 2
  while (existingIds.includes(`${base}-${n}`)) n++
  return `${base}-${n}`
}
