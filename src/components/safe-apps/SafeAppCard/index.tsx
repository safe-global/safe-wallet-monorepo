import Link from 'next/link'
import { useRouter } from 'next/router'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { resolveHref } from 'next/dist/client/resolve-href'
import classNames from 'classnames'
import type { ReactNode, SyntheticEvent } from 'react'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import type { NextRouter } from 'next/router'

import type { UrlObject } from 'url'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import SafeAppTags from '@/components/safe-apps/SafeAppTags'
import { isOptimizedForBatchTransactions } from '@/components/safe-apps/utils'
import { AppRoutes } from '@/config/routes'
import BatchIcon from '@/public/images/apps/batch-icon.svg'
import css from './styles.module.css'
import { Stack } from '@mui/material'
import SafeAppPerks from '../SafeAppPerks'

type SafeAppCardProps = {
  safeApp: SafeAppData
  onClickSafeApp?: () => void
  isBookmarked?: boolean
  onBookmarkSafeApp?: (safeAppId: number) => void
  removeCustomApp?: (safeApp: SafeAppData) => void
  openPreviewDrawer?: (safeApp: SafeAppData) => void
  perks?: ReactNode | string
}

const SafeAppCard = ({
  safeApp,
  onClickSafeApp,
  isBookmarked,
  onBookmarkSafeApp,
  removeCustomApp,
  openPreviewDrawer,
  perks,
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
      perks={perks}
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

type SafeAppCardViewProps = {
  safeApp: SafeAppData
  onClickSafeApp?: () => void
  safeAppUrl: string
  isBookmarked?: boolean
  onBookmarkSafeApp?: (safeAppId: number) => void
  removeCustomApp?: (safeApp: SafeAppData) => void
  openPreviewDrawer?: (safeApp: SafeAppData) => void
  perks?: ReactNode | string
}

const SafeAppCardGridView = ({
  safeApp,
  onClickSafeApp,
  safeAppUrl,
  isBookmarked,
  onBookmarkSafeApp,
  removeCustomApp,
  openPreviewDrawer,
  perks,
}: SafeAppCardViewProps) => {
  return (
    <SafeAppCardContainer safeAppUrl={safeAppUrl} onClickSafeApp={onClickSafeApp} height="100%">
      {/* Safe App Header */}
      <CardHeader
        className={css.safeAppHeader}
        avatar={
          <div className={css.safeAppIconContainer}>
            {/* Batch transactions Icon */}
            {isOptimizedForBatchTransactions(safeApp) && (
              <BatchIcon className={css.safeAppBatchIcon} alt="batch transactions icon" />
            )}

            {/* Safe App Icon */}
            <Stack direction="row" gap="12px" justifyContent="flex-start" alignItems="center" fontSize="42px">
              <SafeAppIconCard src={safeApp.iconUrl} alt={`${safeApp.name} logo`} />
              <Typography className={css.safeAppTitle} gutterBottom variant="h5">
                {safeApp.name}
              </Typography>
            </Stack>

            <SafeAppTags tags={safeApp.tags} />
          </div>
        }
        action={
          <>
            {/* Safe App Action Buttons */}
            {/* <SafeAppActionButtons
              safeApp={safeApp}
              isBookmarked={isBookmarked}
              onBookmarkSafeApp={onBookmarkSafeApp}
              removeCustomApp={removeCustomApp}
              openPreviewDrawer={openPreviewDrawer}
            /> */}
          </>
        }
      />

      <CardContent className={css.safeAppContent}>
        <Typography className={css.safeAppDescription} variant="body2" color="text.secondary">
          {safeApp.description}
        </Typography>
        <SafeAppPerks content={perks} />
      </CardContent>
    </SafeAppCardContainer>
  )
}

type SafeAppCardContainerProps = {
  onClickSafeApp?: () => void
  safeAppUrl: string
  children: ReactNode
  height?: string
  className?: string
}

export const SafeAppCardContainer = ({
  children,
  safeAppUrl,
  onClickSafeApp,
  height,
  className,
}: SafeAppCardContainerProps) => {
  const handleClickSafeApp = (event: SyntheticEvent) => {
    if (onClickSafeApp) {
      event.preventDefault()
      onClickSafeApp()
    }
  }

  return (
    <Link href={safeAppUrl} passHref rel="noreferrer" onClick={handleClickSafeApp}>
      <Card className={classNames(css.safeAppContainer, className)} sx={{ height }}>
        {children}
      </Card>
    </Link>
  )
}
