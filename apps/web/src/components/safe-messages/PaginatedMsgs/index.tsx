import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import ErrorMessage from '@/components/tx/ErrorMessage'
import useSafeMessages from '@/hooks/messages/useSafeMessages'
import LinkIcon from '@/public/images/common/link.svg'
import NoMessagesIcon from '@/public/images/messages/no-messages.svg'
import InfiniteScroll from '@/components/common/InfiniteScroll'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import MsgList from '@/components/safe-messages/MsgList'
import SkeletonTxList from '@/components/common/PaginatedTxns/SkeletonTxList'
import useSafeInfo from '@/hooks/useSafeInfo'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const NoMessages = (): ReactElement => {
  return (
    <PagePlaceholder
      img={<NoMessagesIcon />}
      text={
        <Typography variant="paragraph" className="m-4 max-w-[600px] text-[var(--color-primary-light)]">
          Some applications allow you to interact with them via off-chain contract signatures (&ldquo;messages&ldquo;)
          that you can generate with your Safe Account.
        </Typography>
      }
    >
      <Link rel="noopener noreferrer" target="_blank" href={HelpCenterArticle.SIGNED_MESSAGES} className="font-bold">
        Learn more about off-chain messages <LinkIcon className="ml-1 inline size-5 align-middle" />
      </Link>
    </PagePlaceholder>
  )
}

const MsgPage = ({
  pageUrl,
  onNextPage,
}: {
  pageUrl: string
  onNextPage?: (pageUrl: string) => void
}): ReactElement => {
  const { page, error, loading } = useSafeMessages(pageUrl)

  return (
    <>
      {page && page.results.length > 0 && <MsgList items={page.results} />}
      {page?.results.length === 0 && <NoMessages />}
      {error && <ErrorMessage>Error loading messages</ErrorMessage>}
      {loading && <SkeletonTxList />}
      {page?.next && onNextPage && (
        <div className="my-8 text-center">
          <InfiniteScroll onLoadMore={() => onNextPage(page.next!)} />
        </div>
      )}
    </>
  )
}

const PaginatedMsgs = (): ReactElement => {
  const [pages, setPages] = useState<string[]>([''])
  const { safeAddress, safe } = useSafeInfo()

  // Trigger the next page load
  const onNextPage = (pageUrl: string) => {
    setPages((prev) => prev.concat(pageUrl))
  }

  // Reset the pages when the Safe Account changes
  useEffect(() => {
    setPages([''])
  }, [safe.chainId, safeAddress])

  return (
    <div className="relative mb-8">
      {pages.map((pageUrl, index) => (
        <MsgPage key={pageUrl} pageUrl={pageUrl} onNextPage={index === pages.length - 1 ? onNextPage : undefined} />
      ))}
    </div>
  )
}

export default PaginatedMsgs
