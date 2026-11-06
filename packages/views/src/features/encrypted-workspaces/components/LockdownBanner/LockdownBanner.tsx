import { Lock } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'

export type LockdownBannerProps = {
  isCopied: boolean
  onCopyLink: () => void
}

export const LockdownBanner = ({ isCopied, onCopyLink }: LockdownBannerProps) => (
  <div
    role="status"
    data-testid="lockdown-banner"
    className="fixed top-4 left-1/2 z-50 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-center gap-3 rounded-lg bg-foreground px-4 py-1.5 text-background shadow-lg"
  >
    <Lock aria-hidden="true" className="size-4" />
    <Typography variant="paragraph-small">
      Encrypted Workspace: only people with this link can read it. Tracking is off.
    </Typography>
    <Button size="sm" variant="secondary" onClick={onCopyLink}>
      {isCopied ? 'Link copied' : 'Copy link'}
    </Button>
  </div>
)
