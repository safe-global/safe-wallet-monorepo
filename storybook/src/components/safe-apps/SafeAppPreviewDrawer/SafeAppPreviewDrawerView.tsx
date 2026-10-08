import Link from 'next/link'
import type { ReactElement, ReactNode } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import CloseIcon from '@/public/images/common/close.svg'
import css from './styles.module.css'

export type SafeAppPreviewDrawerViewProps = {
  safeApp?: SafeAppData
  isOpen: boolean
  onClose: () => void
  safeAppUrl: string
  onOpenSafe: () => void
  actionButtons: ReactNode
  tags: ReactNode
  networkLogos: ReactNode
  socialLinks: ReactNode
}

export function SafeAppPreviewDrawerView({
  safeApp,
  isOpen,
  onClose,
  safeAppUrl,
  onOpenSafe,
  actionButtons,
  tags,
  networkLogos,
  socialLinks,
}: SafeAppPreviewDrawerViewProps): ReactElement {
  return (
    <Drawer direction="right" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* eslint-disable-next-line no-restricted-syntax -- rounded-l-xl/rounded-tr-none: bespoke preview drawer radius, no drawer radius token; 450px: legacy preview drawer width, wider than the drawer's max-w-sm default */}
      <DrawerContent className="rounded-l-xl rounded-tr-none data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-[450px]">
        <DrawerTitle className="sr-only">{safeApp?.name} preview</DrawerTitle>
        <div className={`${css.drawerContainer} !pt-5`}>
          {/* Toolbar */}

          {safeApp && (
            <div className="flex justify-end">
              {actionButtons}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onClose}
                      aria-label={`Close ${safeApp.name} preview`}
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

          <Typography variant="paragraph-small" className="block mt-4 text-[var(--color-primary-light)]">
            {safeApp?.description}
          </Typography>

          {/* Tags */}
          {tags}

          {/* Networks */}
          <Typography variant="paragraph-small" className="block mt-4 text-[var(--color-text-secondary)]">
            Available networks
          </Typography>

          <div className="mt-4 flex">{networkLogos}</div>

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
          {safeApp && socialLinks}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
