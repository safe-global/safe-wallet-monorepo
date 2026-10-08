import type { ReactElement, ReactNode } from 'react'
import type { UrlObject } from 'url'
import Track from '@/components/common/Track'
import AddIcon from '@/public/images/common/add.svg'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import NextLink from 'next/link'

export type AddSafeButtonViewProps = {
  trackingLabel: string
  href: UrlObject
  onLinkClick?: () => void
}

export const AddSafeButtonView = ({ trackingLabel, href, onLinkClick }: AddSafeButtonViewProps) => {
  return (
    <Track {...OVERVIEW_EVENTS.ADD_TO_WATCHLIST} label={trackingLabel}>
      <Button
        data-testid="add-safe-button"
        variant="outline"
        size="action"
        onClick={onLinkClick}
        className="max-[599px]:w-full"
        render={<NextLink href={href} />}
      >
        <AddIcon color="currentColor" className="size-5 fill-primary" />
        Add
      </Button>
    </Track>
  )
}

export type AccountsHeaderViewProps = {
  isSidebar: boolean
  isDarkMode: boolean
  showTitle: boolean
  trackingLabel: string
  hasWallet: boolean
  accountsNavigation: ReactNode
  addSafeButton: ReactNode
  createButton: ReactElement
  renderConnectWalletButton: (props: { size: 'action' }) => ReactNode
}

export const AccountsHeaderView = ({
  isSidebar,
  isDarkMode,
  showTitle,
  trackingLabel,
  hasWallet,
  accountsNavigation,
  addSafeButton,
  createButton,
  renderConnectWalletButton,
}: AccountsHeaderViewProps) => {
  return (
    <div
      className={cn(
        'shadcn-scope flex justify-between gap-4 py-6 max-[599px]:flex-col',
        isDarkMode && 'dark',
        isSidebar && 'border-border border-b px-4',
      )}
    >
      {showTitle ? <Typography variant={isSidebar ? 'h3' : 'h1'}>Accounts</Typography> : accountsNavigation}

      <div className="flex flex-row gap-2 max-[599px]:[&>span]:flex-1">
        {addSafeButton}

        {hasWallet ? (
          <Track {...OVERVIEW_EVENTS.CREATE_NEW_SAFE} label={trackingLabel}>
            {createButton}
          </Track>
        ) : (
          renderConnectWalletButton({ size: 'action' })
        )}
      </div>
    </div>
  )
}
