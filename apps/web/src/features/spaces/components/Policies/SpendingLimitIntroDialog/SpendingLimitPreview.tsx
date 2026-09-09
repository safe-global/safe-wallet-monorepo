import type { ReactElement } from 'react'
import Identicon from '@/components/common/Identicon'
import TokenIcon from '@/components/common/TokenIcon'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Typography } from '@/components/ui/typography'

/**
 * Illustrative values, not live data: the intro is shown before any limit exists, so there is
 * nothing real to read — these mirror the design so the preview reads as a finished limit
 * rather than an empty state. Two distinct spenders keep the identicons from looking like the
 * same row rendered twice.
 */
const PREVIEW_SPENDERS = ['0x8674ff2cC41CE1A26D0A1B4b8f6c8B58F7bca19b', '0x2F4b9a1Cd3e5F70a8b6c4D2E1a9F8c7B6E5d4c3b']

const PREVIEW_TOKEN = {
  symbol: 'USDC',
  logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
  allowance: '1,500/Month',
  remaining: '500 USDC remaining',
  /** 500 of the 1,500 monthly allowance is still available. */
  remainingPercentage: 33,
}

/**
 * The cards recede: each one sits lower, wider and less transparent than the one behind it. The
 * offsets and widths are the illustration's designed geometry, not a layout that should reflow.
 */
const SPENDER_CARDS = [
  { address: PREVIEW_SPENDERS[0], position: 'top-[14px] w-[245px] opacity-50' },
  { address: PREVIEW_SPENDERS[1], position: 'top-[46px] w-[279px] opacity-80' },
]

/** `0x` and the ellipsis stay muted; the head and tail that identify the account are bold. */
const PreviewAddress = ({ address }: { address: string }): ReactElement => (
  <Typography variant="paragraph-mini" color="muted" className="font-mono">
    0x
    <span className="font-semibold text-foreground">{address.slice(2, 5)}</span>
    ...
    <span className="font-semibold text-foreground">{address.slice(-6)}</span>
  </Typography>
)

const SpenderCard = ({ address, position }: { address: string; position: string }): ReactElement => (
  <div
    className={`absolute left-1/2 flex h-10 -translate-x-1/2 items-center gap-2 rounded-md bg-card px-3 py-2 shadow-md ${position}`}
  >
    <Typography variant="paragraph-mini-medium" className="flex-1">
      Spender
    </Typography>

    <Identicon address={address} size={24} />

    <PreviewAddress address={address} />
  </div>
)

/**
 * The end result of the flow, as an illustration: who may spend, how much per period, and how
 * much of the current period is left. Plain elements rather than the Card primitives — this is
 * a picture of a limit, not a card the user can act on.
 */
const SpendingLimitPreview = (): ReactElement => (
  <div
    data-testid="spending-limit-preview"
    className="relative h-[200px] w-full overflow-hidden rounded-xl bg-surface-sunken"
  >
    {SPENDER_CARDS.map(({ address, position }) => (
      <SpenderCard key={address} address={address} position={position} />
    ))}

    <div className="absolute left-1/2 top-[98px] flex w-[319px] -translate-x-1/2 flex-col gap-2 rounded-md bg-card p-2 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TokenIcon logoUri={PREVIEW_TOKEN.logoUri} tokenSymbol={PREVIEW_TOKEN.symbol} size={24} />

          <Typography variant="paragraph-mini">{PREVIEW_TOKEN.symbol}</Typography>
        </div>

        <Typography variant="paragraph-mini-medium">{PREVIEW_TOKEN.allowance}</Typography>
      </div>

      <div className="flex flex-col gap-1">
        {/* Hidden from assistive tech: an illustrated limit has no progress worth announcing. */}
        <Progress value={PREVIEW_TOKEN.remainingPercentage} aria-hidden>
          <ProgressTrack className="bg-border">
            <ProgressIndicator className="bg-badge-dot-success" />
          </ProgressTrack>
        </Progress>

        <Typography variant="paragraph-mini" color="muted">
          {PREVIEW_TOKEN.remaining}
        </Typography>
      </div>
    </div>
  </div>
)

export default SpendingLimitPreview
