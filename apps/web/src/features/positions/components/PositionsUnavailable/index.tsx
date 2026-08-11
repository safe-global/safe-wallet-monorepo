import DefiIcon from '@/public/images/balances/defi.svg'
import { Typography } from '@/components/ui/typography'

// This component is displayed when the positions feature flag is enabled,
// but the API does not return data from CGW (Client Gateway), or errors out.
const PositionsUnavailable = ({ hasError = false }: { hasError?: boolean }) => {
  const title = hasError ? "Couldn't load your positions" : 'Positions are not available on this network'

  const subtitle = hasError ? 'Try again later' : 'Positions feature is still in beta and will be available soon'

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <div className="flex justify-center">
        <DefiIcon />
      </div>

      <Typography data-testid="positions-unavailable-text" align="center" className="text-[var(--color-primary-light)]">
        {title}
      </Typography>

      <Typography variant="paragraph-mini" align="center" className="mt-2 block text-[var(--color-primary-light)]">
        {subtitle}
      </Typography>
    </div>
  )
}

export default PositionsUnavailable
