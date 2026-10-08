import Link from 'next/link'
import classNames from 'classnames'
import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import BatchIcon from '@/public/images/apps/batch-icon.svg'
import css from './styles.module.css'

export type SafeAppCardViewProps = {
  safeApp: SafeAppData
  safeAppUrl: string
  onClickSafeApp?: (e: SyntheticEvent) => void
  compact?: boolean
  isOptimizedForBatch?: boolean
  actionButtons: ReactNode
  tags: ReactNode
}

export function SafeAppCardView({
  safeApp,
  onClickSafeApp,
  safeAppUrl,
  compact,
  isOptimizedForBatch,
  actionButtons,
  tags,
}: SafeAppCardViewProps): ReactElement {
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
          {isOptimizedForBatch && <BatchIcon className={css.safeAppBatchIcon} alt="batch transactions icon" />}

          {/* Safe App Icon */}
          <SafeAppIconCard src={safeApp.iconUrl} alt={`${safeApp.name} logo`} />
        </div>

        {/* Safe App Action Buttons */}
        {!compact && actionButtons}
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
        {tags}
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
    <Card size="none" className={classNames(css.safeAppContainer, 'relative isolate', className)} style={{ height }}>
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
