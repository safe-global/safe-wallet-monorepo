/** Inclusive `[from, to]` block range. */
export type BlockRange = readonly [from: number, to: number]

/** Inclusive ranges of at most `size` blocks each covering `[from, to]`. */
export const chunkRanges = (from: number, to: number, size: number): BlockRange[] => {
  const ranges: BlockRange[] = []
  for (let start = from; start <= to; start += size) {
    ranges.push([start, Math.min(start + size - 1, to)])
  }
  return ranges
}

/** Sort ranges and merge any that overlap or touch. */
export const mergeRanges = (ranges: ReadonlyArray<BlockRange>): BlockRange[] => {
  const merged: Array<[number, number]> = []
  for (const [from, to] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1]
    if (last && from <= last[1] + 1) last[1] = Math.max(last[1], to)
    else merged.push([from, to])
  }
  return merged
}

/** Raise every range to start at `floor` at the lowest; a range wholly below it is dropped. */
export const clampRanges = (ranges: ReadonlyArray<BlockRange>, floor: number): BlockRange[] =>
  ranges.filter(([, to]) => to >= floor).map(([from, to]) => [Math.max(from, floor), to])

/**
 * The ranges to read for `[from, to]` under a block budget. A span within `cap`
 * is read whole; a longer one reads only its first and last half of the cap and
 * is reported incomplete.
 */
export const boundedRanges = (from: number, to: number, cap: number): { ranges: BlockRange[]; complete: boolean } => {
  if (to - from + 1 <= cap) return { ranges: [[from, to]], complete: true }
  const half = Math.floor(cap / 2)
  return {
    ranges: mergeRanges([
      [from, from + half - 1],
      [to - half + 1, to],
    ]),
    complete: false,
  }
}
