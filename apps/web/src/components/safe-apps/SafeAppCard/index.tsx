import Link from 'next/link'
import { useRouter } from 'next/router'
import { resolveHref } from 'next/dist/client/resolve-href'
import classNames from 'classnames'
import type { ReactNode, SyntheticEvent } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import type { NextRouter } from 'next/router'

import type { UrlObject } from 'url'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import SafeAppActionButtons from '@/components/safe-apps/SafeAppActionButtons'
import SafeAppTags from '@/components/safe-apps/SafeAppTags'
import { isOptimizedForBatchTransactions } from '@/components/safe-apps/utils'
import { AppRoutes } from '@/config/routes'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import BatchIcon from '@/public/images/apps/batch-icon.svg'
import css from './styles.module.css'

type SafeAppCardProps = {
  safeApp: SafeAppData
  onClickSafeApp?: (e: SyntheticEvent) => void
  isBookmarked?: boolean
  onBookmarkSafeApp?: (safeAppId: number) => void
  removeCustomApp?: (safeApp: SafeAppData) => void
  openPreviewDrawer?: (safeApp: SafeAppData) => void
  compact?: boolean
}

const SafeAppCard = ({
  safeApp,
  onClickSafeApp,
  isBookmarked,
  onBookmarkSafeApp,
  removeCustomApp,
  openPreviewDrawer,
  compact = false,
}: SafeAppCardProps) => {
  const router = useRouter()

  const safeAppUrl = getSafeAppUrl(router, safeApp.url)

  return (
    <SafeAppCardGridView
      safeApp={safeApp}
      safeAppUrl={safeAppUrl}
      isBookmarked={isBookmarked}
      onBookmarkSafeApp={onBookmarkSafeApp}
      removeCustomApp={removeCustomApp}
      onClickSafeApp={onClickSafeApp}
      openPreviewDrawer={openPreviewDrawer}
      compact={compact}
    />
  )
}

export default SafeAppCard

export const getSafeAppUrl = (router: NextRouter, safeAppUrl: string) => {
  const shareUrlObj: UrlObject = {
    pathname: AppRoutes.apps.open,
    query: { safe: router.query.safe, appUrl: safeAppUrl },
  }

  return resolveHref(router, shareUrlObj)
}

type SafeAppCardViewProps = SafeAppCardProps & {
  safeAppUrl: string
}

const SafeAppCardGridView = ({
  safeApp,
  onClickSafeApp,
  safeAppUrl,
  isBookmarked,
  onBookmarkSafeApp,
  removeCustomApp,
  openPreviewDrawer,
  compact,
}: SafeAppCardViewProps) => {
  return (
    <SafeAppCardContainer
      className={compact ? css.compactContainer : undefined}
      safeAppUrl={safeAppUrl}
      onClickSafeApp={onClickSafeApp}
      height="100%"
      compact={compact}
      ariaLabel={`Open ${safeApp.name}`}
    >
      {/* Safe App Header */}
      <div className={classNames('flex items-start justify-between', css.safeAppHeader)}>
        <div className={css.safeAppIconContainer}>
          {/* Batch transactions Icon */}
          {isOptimizedForBatchTransactions(safeApp) && (
            <BatchIcon className={css.safeAppBatchIcon} alt="batch transactions icon" />
          )}

          {/* Safe App Icon */}
          <SafeAppIconCard src={safeApp.iconUrl} alt={`${safeApp.name} logo`} />
        </div>

        {/* Safe App Action Buttons */}
        {!compact && (
          <SafeAppActionButtons
            safeApp={safeApp}
            isBookmarked={isBookmarked}
            onBookmarkSafeApp={onBookmarkSafeApp}
            removeCustomApp={removeCustomApp}
            openPreviewDrawer={openPreviewDrawer}
          />
        )}
      </div>

      <div className={css.safeAppContent}>
        {/* Safe App Title */}
        <Typography className={classNames('mb-2', css.safeAppTitle)} variant="paragraph-bold">
          {safeApp.name}
        </Typography>

        {/* Safe App Description */}
        {!compact && (
          <Typography
            variant="paragraph-small"
            className={classNames(css.safeAppDescription, 'text-[var(--color-text-secondary)]')}
          >
            {safeApp.description}
          </Typography>
        )}

        {/* Safe App Tags */}
        <SafeAppTags tags={safeApp.tags} compact={compact} />
      </div>
    </SafeAppCardContainer>
  )
}

type SafeAppCardContainerProps = {
  onClickSafeApp?: (e: SyntheticEvent) => void
  safeAppUrl: string
  children: ReactNode
  height?: string
  className?: string
  compact?: boolean
  ariaLabel?: string
}

export const SafeAppCardContainer = ({
  children,
  safeAppUrl,
  onClickSafeApp,
  height,
  className,
  ariaLabel = 'Open Safe app',
}: SafeAppCardContainerProps) => {
  const handleClickSafeApp = (event: SyntheticEvent) => {
    if (onClickSafeApp) {
      onClickSafeApp(event)
    }
  }

  return (
    <Card size="none" className={classNames(css.safeAppContainer, 'relative', className)} style={{ height }}>
      <Link
        href={safeAppUrl}
        rel="noreferrer"
        onClick={handleClickSafeApp}
        aria-label={ariaLabel}
        className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="relative z-10 h-full pointer-events-none [&_[data-slot=tooltip-trigger]]:pointer-events-auto [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        {children}
      </div>
    </Card>
  )
}
