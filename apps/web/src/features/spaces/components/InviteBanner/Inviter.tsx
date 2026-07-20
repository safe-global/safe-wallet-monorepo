import { Stack, Typography, type TypographyProps } from '@mui/material'
import { isAddress } from 'ethers'
import EthHashInfo from '@/components/common/EthHashInfo'
import EmailInfo from '@/components/common/EmailInfo'
import css from './styles.module.css'

type InviterProps = {
  invitedByName: string | undefined
  variant: TypographyProps['variant']
  avatarSize: number
}

const Inviter = ({ invitedByName, variant, avatarSize }: InviterProps) => {
  if (!invitedByName) return null

  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Typography variant={variant}>by</Typography>
      {/* Typography wrapper keeps the inviter name at the same font size as the surrounding text. */}
      <Typography variant={variant} component="div" className={css.inviterName}>
        {isAddress(invitedByName) ? (
          <EthHashInfo address={invitedByName} avatarSize={avatarSize} showName={false} showPrefix={false} />
        ) : (
          <EmailInfo email={invitedByName} size="small" />
        )}
      </Typography>
    </Stack>
  )
}

export default Inviter
