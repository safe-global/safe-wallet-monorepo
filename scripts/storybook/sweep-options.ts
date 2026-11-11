export type Mode = string

export interface StoryEntry {
  id: string
  title: string
  name: string
  type: string
  tags?: string[]
}

export interface SweepOptions {
  base: string
  modes: Mode[]
  concurrency: number
  filters: string[]
  shard: number
  shardCount: number
  shotsDir?: string
  manifestFile?: string
  jsonFile?: string
}

const DEFAULT_BASE = 'http://localhost:6006'
const DEFAULT_MODES = 'light,dark'
const DEFAULT_CONCURRENCY = 8

/** `--name=value` arguments as a map; a bare `--flag` has no value and is ignored by the sweep */
function readFlags(argv: string[]): Map<string, string> {
  const flags = new Map<string, string>()
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/)
    if (match) flags.set(match[1], match[2])
  }
  return flags
}

const listOf = (value: string): string[] => value.split(',').filter(Boolean)

/** Reads the sweep's command line; see the usage in render-sweep.ts */
export function parseOptions(argv: string[], env: Record<string, string | undefined>): SweepOptions {
  const flags = readFlags(argv)
  const [shard, shardCount] = (flags.get('shard') ?? '1/1').split('/').map(Number)
  return {
    base: flags.get('base') || env.SB_BASE || DEFAULT_BASE,
    modes: (flags.get('modes') ?? DEFAULT_MODES).split(','),
    concurrency: Number(flags.get('concurrency')) || DEFAULT_CONCURRENCY,
    filters: listOf(flags.get('filter') ?? ''),
    shard,
    shardCount,
    shotsDir: flags.get('shots'),
    manifestFile: flags.get('manifest'),
    jsonFile: flags.get('json'),
  }
}

/** Stories (not docs) whose id or title contains any of the filters; all stories without filters */
export function selectStories(entries: StoryEntry[], filters: string[]): StoryEntry[] {
  return entries.filter(
    (entry) =>
      entry.type === 'story' &&
      (filters.length === 0 || filters.some((filter) => entry.id.includes(filter) || entry.title.includes(filter))),
  )
}
