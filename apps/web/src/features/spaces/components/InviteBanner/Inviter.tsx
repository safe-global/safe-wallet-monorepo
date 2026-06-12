import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import EmailInfo from '@/components/common/EmailInfo'
import { Typography } from '@/components/ui/typography'
import { type ComponentProps } from 'react'

type InviterProps = {
  invitedByName: string | undefined
  variant: ComponentProps<typeof Typography>['variant']
  avatarSize: number
}

const Inviter = ({ invitedByName, variant, avatarSize }: InviterProps) => {
  if (!invitedByName) return null

  return (
    <div className="flex flex-row items-end gap-1.5">
      <Typography variant={variant}>by</Typography>
      <div className="flex items-center gap-1 font-bold text-primary">
        {isAddress(invitedByName) ? (
          <EthHashInfo
            address={invitedByName}
            avatarSize={avatarSize}
            showName={false}
            showPrefix={false}
            copyPrefix={false}
          />
        ) : (
          <EmailInfo email={invitedByName} size="small" />
        )}
      </div>
    </div>
  )
}

export default Inviter
