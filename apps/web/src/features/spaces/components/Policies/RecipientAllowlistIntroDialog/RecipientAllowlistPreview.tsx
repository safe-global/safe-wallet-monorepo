import type { ReactElement } from 'react'
import { Ban, Check } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import { Typography } from '@safe-global/views/components/ui/typography'

/** Illustrative values: the intro is shown before any allowlist exists, so nothing here is real. */
const ALLOWED_RECIPIENTS = [
  '0x4bc91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60a88b',
  '0x7a219e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b4412',
  '0x1f8e2a3b4c5d6e7f8091a2b3c4d5e6f708195517',
]
const BLOCKED_RECIPIENT = '0x6d0a9f2c71b8e04d6a3c5b17e92f08d4c6a13e58'

const PreviewRow = ({ address, isBlocked = false }: { address: string; isBlocked?: boolean }): ReactElement => (
  <div className="flex items-center gap-2 rounded-md bg-muted p-2">
    <Identicon address={address} size={20} />
    <span className="h-2 w-24 rounded-full bg-border" />
    {isBlocked ? (
      <Ban className="ml-auto size-4 text-destructive" />
    ) : (
      <Check className="ml-auto size-4 text-badge-dot-success" />
    )}
  </div>
)

const RecipientAllowlistPreview = (): ReactElement => (
  // Hidden from assistive tech: the addresses are invented and the copy already explains the allowlist.
  <div
    aria-hidden
    data-testid="recipient-allowlist-preview"
    className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl bg-surface-sunken px-4"
  >
    <div className="flex w-full max-w-[300px] flex-col gap-1.5 rounded-md bg-card p-3 shadow-lg">
      <Typography variant="paragraph-mini-medium">Allowed recipients</Typography>
      {ALLOWED_RECIPIENTS.map((address) => (
        <PreviewRow key={address} address={address} />
      ))}
      <div className="opacity-60">
        <PreviewRow address={BLOCKED_RECIPIENT} isBlocked />
      </div>
    </div>
  </div>
)

export default RecipientAllowlistPreview
