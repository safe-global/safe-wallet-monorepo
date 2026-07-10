import SafeAppIconCard from '../SafeAppIconCard'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useIsSwapFeatureEnabled } from '@/features/swap'

const SWAPS_APP_CARD_STORAGE_KEY = 'showSwapsAppCard'

const NativeSwapsCard = () => {
  const router = useRouter()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const [isSwapsCardVisible = true, setIsSwapsCardVisible] = useLocalStorage<boolean>(SWAPS_APP_CARD_STORAGE_KEY)
  if (!isSwapFeatureEnabled || !isSwapsCardVisible) return null

  return (
    // eslint-disable-next-line no-restricted-syntax -- h-full fills the dashboard grid cell (layout); the hover tint is a bespoke affordance with no variant
    <Card size="none" className="h-full transition-colors hover:bg-muted">
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="rounded-full bg-[var(--color-secondary-light)] p-2">
          <SafeAppIconCard src="/images/common/swap.svg" alt="Swap Icon" width={24} height={24} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        <Typography variant="paragraph-bold" className="mb-2 truncate">
          Native swaps are here!
        </Typography>

        <Typography variant="paragraph-small" className="block mb-4 line-clamp-3 text-[var(--color-text-secondary)]">
          Experience seamless trading with better decoding and security in native swaps.
        </Typography>

        <div className="mt-auto flex flex-row flex-wrap gap-2 pt-2">
          <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.safeAppsPromoWidget}>
            <Button size="sm" render={<Link href={{ pathname: AppRoutes.swap, query: { safe: router.query.safe } }} />}>
              Try now
            </Button>
          </Track>
          <Button onClick={() => setIsSwapsCardVisible(false)} size="sm" variant="ghost">
            Don&apos;t show
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default NativeSwapsCard
