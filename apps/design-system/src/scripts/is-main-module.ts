import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const isMainModule = (moduleUrl: string): boolean => {
  const entry = process.argv[1]
  return Boolean(entry) && moduleUrl === pathToFileURL(realpathSync(entry)).href
}
