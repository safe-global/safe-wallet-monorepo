import EthHashInfo from '@/components/common/EthHashInfo'
import EmailInfo from '@/components/common/EmailInfo'
import { Typography } from '@/components/ui/typography'
import { type ComponentProps } from 'react'

export type InviterSlotProps = {
  variant: ComponentProps<typeof Typography>['variant']
  avatarSize: number
}

export type InviterViewProps = InviterSlotProps & {
  invitedByName: string
  isAddress: boolean
}

export const InviterView = ({ invitedByName, isAddress, variant, avatarSize }: InviterViewProps) => {
  return (
    <div className="flex flex-row items-center gap-1.5">
      <Typography variant={variant}>by</Typography>
      {/* Typography wrapper keeps the inviter name at the same font size as the surrounding text. */}
      <Typography variant={variant} as="div" className="flex items-center gap-1 font-bold text-primary">
        {isAddress ? (
          <EthHashInfo address={invitedByName} avatarSize={avatarSize} showName={false} showPrefix={false} />
        ) : (
          <EmailInfo email={invitedByName} size="small" />
        )}
      </Typography>
    </div>
  )
}
