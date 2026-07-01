import type { ReactElement } from 'react'
import Link from 'next/link'
import { TicketPercent, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { SidebarMenuItem } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import useIsBillingVisible from '../../../hooks/useIsBillingVisible'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import css from './styles.module.css'

const DISMISSED_KEY = 'get-flat-pricing-banner-dismissed'

export const GetFlatPricingBanner = (): ReactElement | null => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>(DISMISSED_KEY)
  const isBillingVisible = useIsBillingVisible()
  const spaceId = useCurrentSpaceId()

  if (dismissed || isBillingVisible !== true) {
    return null
  }

  const billingHref = { pathname: AppRoutes.spaces.billing, query: spaceId ? { spaceId } : {} }

  return (
    <SidebarMenuItem>
      <div className={cn(css.banner, 'group-data-[collapsible=icon]:hidden')} data-testid="pricing-cta-sidebar">
        <div aria-hidden className={css.glow} />

        <div className="flex w-full items-start justify-between">
          <div className={css.iconBadge}>
            <TicketPercent className="size-4" />
          </div>
          <button
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            data-testid="pricing-cta-dismiss"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <Typography variant="paragraph-small-bold">Get flat pricing</Typography>
          <Typography variant="paragraph-small-medium" color="muted">
            Upgrade to a plan with included fee-free volume.
          </Typography>
        </div>

        <Button
          size="xs"
          className="w-auto self-start rounded-xl px-3 font-normal"
          data-testid="pricing-cta-compare"
          render={<Link href={billingHref} onClick={() => trackEvent(SPACE_EVENTS.COMPARE_PLANS_CLICKED)} />}
        >
          Compare plans
        </Button>
      </div>
    </SidebarMenuItem>
  )
}
