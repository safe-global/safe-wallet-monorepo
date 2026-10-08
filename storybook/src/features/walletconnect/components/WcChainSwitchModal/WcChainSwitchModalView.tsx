import type { ReactNode } from 'react'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export type WcChainSwitchModalViewProps = {
  appName: string
  appIconUrl?: string
  chainName: string
  chainLogo: ReactNode
  hasSafes: boolean
  safeItems: ReactNode
  onCancel: () => void
}

export const WcChainSwitchModalView = ({
  appName,
  appIconUrl,
  chainName,
  chainLogo,
  hasSafes,
  safeItems,
  onCancel,
}: WcChainSwitchModalViewProps) => {
  return (
    <div className="flex min-w-auto flex-col gap-6 sm:min-w-[390px]">
      <div className="flex flex-row items-center gap-4">
        {appIconUrl ? (
          <Avatar className="size-12">
            <AvatarImage src={appIconUrl} alt={appName} />
          </Avatar>
        ) : null}
        <div>
          <Typography variant="h4">{appName}</Typography>
          <div className="flex flex-row items-center gap-2">
            <Typography variant="paragraph-small">wants to switch to</Typography>
            {chainLogo}
            <Typography variant="paragraph-small-bold">{chainName}</Typography>
          </div>
        </div>
      </div>

      <Typography variant="paragraph-small" className="text-muted-foreground">
        {hasSafes
          ? `Select one of your Safes on ${chainName} to continue.`
          : `Connected dapp wants to switch to chain ${chainName} but you don't have Safe accounts deployed on that chain.`}
      </Typography>

      {hasSafes ? (
        <div className="max-h-[440px] overflow-y-auto">{safeItems}</div>
      ) : (
        <div className="rounded-lg border border-[var(--color-border-light)] p-4">
          <Typography variant="paragraph-small">You can load or create a Safe on this network to continue.</Typography>
        </div>
      )}

      <Button variant="outline" onClick={onCancel} className="self-start">
        Cancel
      </Button>
    </div>
  )
}
