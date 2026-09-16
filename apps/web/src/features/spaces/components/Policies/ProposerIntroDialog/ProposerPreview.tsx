import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, UserRound, type LucideIcon } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import Identicon from '@/components/common/Identicon'
import { Typography } from '@/components/ui/typography'

/** Illustrative values: the intro is shown before any proposer exists, so nothing here is real. */
const PREVIEW_SIGNERS = ['0x8674ff2cC41CE1A26D0A1B4b8f6c8B58F7bca19b', '0x2F4b9a1Cd3e5F70a8b6c4D2E1a9F8c7B6E5d4c3b']

// Checksummed: `Identicon` falls back to a pulsing skeleton for an address `isAddress` rejects.
const PREVIEW_PROPOSERS = [
  '0x1C8b9E4a7F2d5c3b6a8e9D0f4c2B7A5E3d1c8b9E',
  '0x9a3e7C5B1D8f2A6C4E0B9d7F3a1C5E8B2d6f4A0c',
  '0x4D7b2E9C6A1F8b3d5C0E7a9B2D4F6c8A1E3b5d7F',
]

const TRANSACTION_ICONS: LucideIcon[] = [ArrowLeftRight, ArrowUpRight, ArrowDownLeft]

/** A grey bar standing in for a row's text; `className` carries its width and fill. */
const PreviewBar = ({ className }: { className: string }): ReactElement => (
  <div className={`h-3 rounded-full ${className}`} />
)

/**
 * Fixed geometry from the design frame, not a layout that should reflow. The cards are taller than
 * the 200px frame on purpose — the design clips them at the bottom edge.
 */
const PreviewCard = ({ className, children }: { className: string; children: ReactNode }): ReactElement => (
  <div
    className={`absolute flex flex-col gap-1.5 rounded-xl bg-card p-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)] ${className}`}
  >
    {children}
  </div>
)

/** The design keeps rows barely distinct from the card: a faint fill, or a hairline on white. */
const PreviewRow = ({ children, className = '' }: { children: ReactNode; className?: string }): ReactElement => (
  <div className={`flex h-[34px] items-center gap-2 rounded-xl px-2 ${className}`}>{children}</div>
)

/** Plain elements, not the Card primitives: a picture of the feature, not a card to act on. */
const ProposerPreview = (): ReactElement => (
  // Hidden from assistive tech: the values are invented and the copy already explains the role.
  <div
    aria-hidden
    data-testid="proposer-preview"
    className="relative h-[200px] w-full overflow-hidden rounded-xl bg-muted"
  >
    <PreviewCard className="left-[26px] top-[20px] h-[250px] w-[228px]">
      <Typography variant="paragraph-small-bold">Transactions</Typography>

      {TRANSACTION_ICONS.map((Icon, index) => (
        <PreviewRow key={index} className="bg-muted/40">
          <Icon className="size-4 shrink-0 text-muted-foreground" />

          <PreviewBar className="w-[60%] bg-muted/70" />
        </PreviewRow>
      ))}
    </PreviewCard>

    <PreviewCard className="left-[108px] top-[82px] h-[183px] w-[166px]">
      <div className="flex items-center gap-2">
        <Typography variant="paragraph-small-bold" className="flex-1">
          Signers
        </Typography>

        <div className="flex items-center gap-1 rounded-full bg-muted/70 px-1.5 py-0.5">
          <UserRound className="size-3 text-muted-foreground" />

          <Typography variant="paragraph-mini-medium" color="muted">
            3/5
          </Typography>
        </div>
      </div>

      {PREVIEW_SIGNERS.map((address) => (
        <PreviewRow key={address} className="border border-border/40">
          <div className="shrink-0">
            <Identicon address={address} size={24} />
          </div>

          <PreviewBar className="w-[55%] bg-muted" />
        </PreviewRow>
      ))}
    </PreviewCard>

    <PreviewCard className="left-[212px] top-[20px] h-[183px] w-[166px]">
      <Typography variant="paragraph-small-bold">Proposers</Typography>

      {PREVIEW_PROPOSERS.map((address) => (
        <PreviewRow key={address} className="border border-border/40">
          <div className="shrink-0">
            <Identicon address={address} size={24} />
          </div>

          <PreviewBar className="w-[55%] bg-muted" />
        </PreviewRow>
      ))}
    </PreviewCard>
  </div>
)

export default ProposerPreview
