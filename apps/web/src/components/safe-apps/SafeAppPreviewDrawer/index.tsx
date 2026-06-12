import Link from 'next/link'
import { useRouter } from 'next/router'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getSafeAppUrl } from '@/components/safe-apps/SafeAppCard'
import ChainIndicator from '@/components/common/ChainIndicator'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import SafeAppActionButtons from '@/components/safe-apps/SafeAppActionButtons'
import SafeAppTags from '@/components/safe-apps/SafeAppTags'
import SafeAppSocialLinksCard from '@/components/safe-apps/SafeAppSocialLinksCard'
import CloseIcon from '@/public/images/common/close.svg'
import { useOpenedSafeApps } from '@/hooks/safe-apps/useOpenedSafeApps'
import css from './styles.module.css'
import { SAFE_APPS_EVENTS, SAFE_APPS_LABELS, trackSafeAppEvent, SafeAppLaunchLocation } from '@/services/analytics'

type SafeAppPreviewDrawerProps = {
  safeApp?: SafeAppData
  isOpen: boolean
  isBookmarked?: boolean
  onClose: () => void
  onBookmark?: (safeAppId: number) => void
}

const SafeAppPreviewDrawer = ({ isOpen, safeApp, isBookmarked, onClose, onBookmark }: SafeAppPreviewDrawerProps) => {
  const { markSafeAppOpened } = useOpenedSafeApps()
  const router = useRouter()
  const safeAppUrl = getSafeAppUrl(router, safeApp?.url || '')

  const onOpenSafe = () => {
    if (safeApp) {
      markSafeAppOpened(safeApp.id)
      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_APP, label: SAFE_APPS_LABELS.apps_sidebar }, safeApp, {
        launchLocation: SafeAppLaunchLocation.PREVIEW_DRAWER,
      })
    }
  }

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="rounded-l-xl rounded-tr-none">
        <DrawerTitle className="sr-only">{safeApp?.name} preview</DrawerTitle>
        <div className={`${css.drawerContainer} !pt-5`}>
          {/* Toolbar */}

          {safeApp && (
            <div className="flex justify-end">
              <SafeAppActionButtons safeApp={safeApp} isBookmarked={isBookmarked} onBookmarkSafeApp={onBookmark} />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onClose}
                      className="ml-2 text-[var(--color-border-main)]"
                    />
                  }
                >
                  <CloseIcon className="size-4 text-[var(--color-border-main)]" />
                </TooltipTrigger>
                <TooltipContent>{`Close ${safeApp.name} preview`}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Safe App Info */}
          <div className="px-2">
            <SafeAppIconCard src={safeApp?.iconUrl} alt={`${safeApp?.name} logo`} width={90} height={90} />
          </div>

          <Typography variant="h4" className="mt-4">
            {safeApp?.name}
          </Typography>

          <Typography variant="paragraph-small" className="mt-4 text-[var(--color-primary-light)]">
            {safeApp?.description}
          </Typography>

          {/* Tags */}
          <SafeAppTags tags={safeApp?.tags || []} />

          {/* Networks */}
          <Typography variant="paragraph-small" className="mt-4 text-[var(--color-text-secondary)]">
            Available networks
          </Typography>

          <div className="mt-4 flex flex-wrap gap-4">
            {safeApp?.chainIds.map((chainId) => (
              <ChainIndicator key={chainId} chainId={chainId} inline showUnknown={false} />
            ))}
          </div>

          {/* Open Safe App button */}
          <Button
            data-testid="open-safe-app-btn"
            className="mt-6 w-full"
            onClick={onOpenSafe}
            render={<Link href={safeAppUrl} />}
          >
            Open Safe App
          </Button>

          {/* Safe App Social Links */}
          {safeApp && <SafeAppSocialLinksCard safeApp={safeApp} />}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default SafeAppPreviewDrawer
