import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import MockupSidebar from '@views/features/spaces/components/OnboardingLayout/mockup/MockupSidebar'
import MockupContent from '@views/features/spaces/components/OnboardingLayout/mockup/MockupContent'
import type {
  SafeAppMockupAccount,
  SafeAppMockupProps,
} from '@views/features/spaces/components/OnboardingLayout/mockup/types'

export type SafeAppMockupViewProps = {
  name: string
  highlight: SafeAppMockupProps['highlight']
  accounts?: SafeAppMockupAccount[]
  safeOverviews: SafeOverview[] | undefined
  formattedTotal: string
  totalFiat: number
}

export const SafeAppMockupView = ({
  name,
  highlight,
  accounts,
  safeOverviews,
  formattedTotal,
  totalFiat,
}: SafeAppMockupViewProps) => {
  const trimmed = name.trim()
  const displayName = trimmed || 'Your Space'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Edge gradients: the inner mockup renders at 1500×900 and is intentionally
          clipped to feel like a peek at a desktop app, not a full UI. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/4 bg-gradient-to-r from-transparent to-muted" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/4 bg-gradient-to-b from-transparent to-muted" />

      <div className="absolute left-50 top-50 flex w-[1500px] flex-col">
        <div className="flex h-[900px] overflow-hidden rounded-3xl border bg-background shadow-sm">
          <MockupSidebar displayName={displayName} initial={initial} highlight={highlight} />
          <MockupContent
            accounts={accounts}
            safeOverviews={safeOverviews}
            totalFormatted={formattedTotal}
            totalFiat={totalFiat}
            highlight={highlight}
          />
        </div>
      </div>
    </div>
  )
}
