import type { SpaceQueuedItemPage, SpaceQueueSafeItems } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/** The `cursor` query param of a page's `next` URL, the only part the queue endpoint takes back. */
export const getNextCursor = (next: string | null | undefined): string | undefined => {
  if (!next) return undefined
  return new URL(next).searchParams.get('cursor') ?? undefined
}

const isSameSafe = (a: SpaceQueueSafeItems, b: SpaceQueueSafeItems): boolean =>
  a.chainId === b.chainId && sameAddress(a.safeAddress, b.safeAddress)

/** Joins the runs of every loaded page, merging a run that continues on the next page into one. */
export const mergeQueueRuns = (pages: SpaceQueuedItemPage[]): SpaceQueueSafeItems[] => {
  return pages
    .flatMap((page) => page.results)
    .reduce<SpaceQueueSafeItems[]>((runs, run) => {
      const last = runs.at(-1)
      if (last && isSameSafe(last, run)) {
        // The gateway restarts a Safe's labels on every page, so a continued run would repeat "Queued"
        const labels = new Set(last.items.flatMap((item) => (item.type === 'LABEL' ? [item.label] : [])))
        const items = run.items.filter((item) => item.type !== 'LABEL' || !labels.has(item.label))
        runs[runs.length - 1] = { ...last, items: [...last.items, ...items] }
        return runs
      }
      runs.push(run)
      return runs
    }, [])
}
