import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import type { ReactElement, ReactNode } from 'react'

import LinkIcon from '@/public/images/common/link.svg'
import NoMessagesIcon from '@/public/images/messages/no-messages.svg'
import PagePlaceholder from '@/components/common/PagePlaceholder'
import SkeletonTxList from '@/components/common/PaginatedTxns/SkeletonTxList'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const NoMessages = (): ReactElement => {
  return (
    <PagePlaceholder
      img={<NoMessagesIcon />}
      text={
        <Typography variant="paragraph" className="m-4 max-w-[600px] text-[var(--color-primary-light)]">
          Some applications allow you to interact with them via off-chain contract signatures (&ldquo;messages&ldquo;)
          that you can generate with your Safe account.
        </Typography>
      }
    >
      <Link rel="noopener noreferrer" target="_blank" href={HelpCenterArticle.SIGNED_MESSAGES} className="font-bold">
        Learn more about off-chain messages <LinkIcon className="ml-1 inline size-5 align-middle" />
      </Link>
    </PagePlaceholder>
  )
}

export type MsgPageViewProps = {
  list?: ReactNode
  isEmpty: boolean
  hasError: boolean
  renderErrorMessage: (children: ReactNode) => ReactNode
  loading: boolean
  infiniteScroll?: ReactNode
}

export const MsgPageView = ({
  list,
  isEmpty,
  hasError,
  renderErrorMessage,
  loading,
  infiniteScroll,
}: MsgPageViewProps): ReactElement => {
  return (
    <>
      {list}
      {isEmpty && <NoMessages />}
      {hasError && renderErrorMessage('Error loading messages')}
      {loading && <SkeletonTxList />}
      {infiniteScroll && <div className="my-8 text-center">{infiniteScroll}</div>}
    </>
  )
}

export type PaginatedMsgsViewProps = {
  children: ReactNode
}

export const PaginatedMsgsView = ({ children }: PaginatedMsgsViewProps): ReactElement => {
  return <div className="relative mb-8">{children}</div>
}
