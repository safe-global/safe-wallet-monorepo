import { createHash } from 'crypto'

/** Image file name → sha256 of its bytes. Chromium encodes identical pixels to identical PNGs. */
export type Manifest = Record<string, string>

export interface ManifestDiff {
  changed: string[]
  added: string[]
  removed: string[]
}

export const hashImage = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex')

export function diffManifests(base: Manifest, head: Manifest): ManifestDiff {
  const files = (manifest: Manifest) => Object.keys(manifest).sort()
  return {
    changed: files(head).filter((file) => file in base && base[file] !== head[file]),
    added: files(head).filter((file) => !(file in base)),
    removed: files(base).filter((file) => !(file in head)),
  }
}

/**
 * Summarises a diff as Markdown for the GitHub job summary.
 *
 * The first line is machine-readable (`sheets changed: <n> of <total>`) so the numbers can be
 * collected across runs.
 */
export function formatDiff(diff: ManifestDiff, total: number): string {
  const count = diff.changed.length + diff.added.length + diff.removed.length
  const section = (heading: string, files: string[]) =>
    files.length ? `\n### ${heading} (${files.length})\n\n${files.map((f) => `- \`${f}\``).join('\n')}\n` : ''
  return (
    `sheets changed: ${count} of ${total}\n` +
    section('Changed', diff.changed) +
    section('Added', diff.added) +
    section('Removed', diff.removed)
  )
}
