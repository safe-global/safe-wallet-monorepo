import SafeAppIconCard from '../SafeAppIconCard'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'

type NativeSwapsCardProps = {
  onDismiss: () => void
}

const NativeSwapsCard = ({ onDismiss }: NativeSwapsCardProps) => {
  const router = useRouter()

  return (
    // eslint-disable-next-line no-restricted-syntax -- h-full fills the dashboard grid cell (layout); the hover tint is a bespoke affordance with no variant
    <Card size="none" className="h-full transition-colors">
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

        <div className="mt-auto flex flex-row flex-wrap justify-end gap-2 pt-2">
          <Button onClick={onDismiss} size="sm" variant="ghost" className="mr-auto">
            Don&apos;t show
          </Button>
          <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.safeAppsPromoWidget}>
            <Button size="sm" render={<Link href={{ pathname: AppRoutes.swap, query: { safe: router.query.safe } }} />}>
              Try now
            </Button>
          </Track>
        </div>
      </div>
    </Card>
  )
}

export default NativeSwapsCard
