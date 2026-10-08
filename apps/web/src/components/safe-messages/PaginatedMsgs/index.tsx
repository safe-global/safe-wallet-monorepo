import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'

import ErrorMessage from '@/components/tx/ErrorMessage'
import useSafeMessages from '@/hooks/messages/useSafeMessages'
import InfiniteScroll from '@/components/common/InfiniteScroll'
import MsgList from '@/components/safe-messages/MsgList'
import useSafeInfo from '@/hooks/useSafeInfo'
import { MsgPageView, PaginatedMsgsView } from '@views/components/safe-messages/PaginatedMsgs/PaginatedMsgsView'

const renderErrorMessage = (children: ReactNode) => <ErrorMessage>{children}</ErrorMessage>

const MsgPage = ({
  pageUrl,
  onNextPage,
}: {
  pageUrl: string
  onNextPage?: (pageUrl: string) => void
}): ReactElement => {
  const { page, error, loading } = useSafeMessages(pageUrl)

  return (
    <MsgPageView
      list={page && page.results.length > 0 && <MsgList items={page.results} />}
      isEmpty={page?.results.length === 0}
      hasError={!!error}
      renderErrorMessage={renderErrorMessage}
      loading={loading}
      infiniteScroll={page?.next && onNextPage && <InfiniteScroll onLoadMore={() => onNextPage(page.next!)} />}
    />
  )
}

const PaginatedMsgs = (): ReactElement => {
  const [pages, setPages] = useState<string[]>([''])
  const { safeAddress, safe } = useSafeInfo()

  // Trigger the next page load
  const onNextPage = (pageUrl: string) => {
    setPages((prev) => prev.concat(pageUrl))
  }

  // Reset the pages when the Safe account changes
  useEffect(() => {
    setPages([''])
  }, [safe.chainId, safeAddress])

  return (
    <PaginatedMsgsView>
      {pages.map((pageUrl, index) => (
        <MsgPage key={pageUrl} pageUrl={pageUrl} onNextPage={index === pages.length - 1 ? onNextPage : undefined} />
      ))}
    </PaginatedMsgsView>
  )
}

export default PaginatedMsgs
