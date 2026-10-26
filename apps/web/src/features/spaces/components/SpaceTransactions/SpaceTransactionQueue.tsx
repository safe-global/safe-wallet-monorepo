import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import {
  useSpaceTransactionsGetTransactionQueueV1Query,
  type SpaceQueuedItemPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import PagePlaceholder from '@safe-global/views/components/common/PagePlaceholder'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import { Typography } from '@safe-global/views/components/ui/typography'
import InfiniteScroll from '@/components/common/InfiniteScroll'
import ErrorMessage from '@/components/tx/ErrorMessage'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'
import SpaceQueueTable from './SpaceQueueTable'
import { getNextCursor, groupQueueBySafe } from './utils'

const FIRST_PAGE = ''

const QueuePageLoader = ({
  spaceId,
  cursor,
  onLoaded,
  onError,
}: {
  spaceId: string
  cursor: string
  onLoaded: (cursor: string, page: SpaceQueuedItemPage) => void
  onError: (cursor: string) => void
}): null => {
  const { currentData, isError } = useSpaceTransactionsGetTransactionQueueV1Query({
    spaceId,
    cursor: cursor || undefined,
  })

  useEffect(() => {
    if (currentData) onLoaded(cursor, currentData)
  }, [currentData, cursor, onLoaded])

  useEffect(() => {
    if (isError) onError(cursor)
  }, [isError, cursor, onError])

  return null
}

const SpaceQueue = ({ spaceId }: { spaceId: string }): ReactElement => {
  const [cursors, setCursors] = useState<string[]>([FIRST_PAGE])
  const [pages, setPages] = useState<Map<string, SpaceQueuedItemPage>>(new Map())
  const [failedCursors, setFailedCursors] = useState<Set<string>>(new Set())

  const onLoaded = useCallback((cursor: string, page: SpaceQueuedItemPage) => {
    setPages((prev) => (prev.get(cursor) === page ? prev : new Map(prev).set(cursor, page)))
  }, [])

  const onError = useCallback((cursor: string) => {
    setFailedCursors((prev) => (prev.has(cursor) ? prev : new Set(prev).add(cursor)))
  }, [])

  const loadedPages = useMemo(() => {
    const loaded: SpaceQueuedItemPage[] = []
    for (const cursor of cursors) {
      const page = pages.get(cursor)
      if (!page) break
      loaded.push(page)
    }
    return loaded
  }, [cursors, pages])

  const sections = useMemo(() => groupQueueBySafe(loadedPages), [loadedPages])
  const lastCursor = cursors[cursors.length - 1]
  const hasError = failedCursors.has(lastCursor)
  const isLoading = !hasError && loadedPages.length < cursors.length
  const nextCursor = loadedPages.length === cursors.length ? getNextCursor(loadedPages.at(-1)?.next) : undefined
  const unavailableSafes = loadedPages[0]?.unavailableSafes ?? []

  const onLoadMore = () => {
    if (nextCursor && !cursors.includes(nextCursor)) {
      setCursors((prev) => [...prev, nextCursor])
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {cursors.map((cursor) => (
        <QueuePageLoader key={cursor} spaceId={spaceId} cursor={cursor} onLoaded={onLoaded} onError={onError} />
      ))}

      {unavailableSafes.length > 0 && (
        <Typography variant="paragraph-small" color="muted">
          {unavailableSafes.length === 1
            ? "1 Safe account couldn't be loaded, so its transactions aren't shown."
            : `${unavailableSafes.length} Safe accounts couldn't be loaded, so their transactions aren't shown.`}
        </Typography>
      )}

      {sections.length > 0 && <SpaceQueueTable sections={sections} />}

      {!isLoading && !hasError && sections.length === 0 && (
        <PagePlaceholder
          img={<NoTransactionsIcon />}
          text="Pending transactions of your Safe accounts will appear here"
        />
      )}

      {hasError && <ErrorMessage>Error loading transactions</ErrorMessage>}

      {isLoading && <SkeletonTxList />}

      {nextCursor && (
        <div className="my-8 text-center">
          <InfiniteScroll onLoadMore={onLoadMore} />
        </div>
      )}
    </div>
  )
}

// Keyed by Space, so switching Space starts from the first page with no state left over
const SpaceTransactionQueue = ({ spaceId }: { spaceId: string }): ReactElement => (
  <SpaceQueue key={spaceId} spaceId={spaceId} />
)

export default SpaceTransactionQueue
