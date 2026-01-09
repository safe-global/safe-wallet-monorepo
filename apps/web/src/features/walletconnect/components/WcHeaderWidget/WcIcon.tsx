import { type ReactElement } from 'react'
import { Badge, ButtonBase, SvgIcon } from '@mui/material'
import WalletConnectIcon from '@/public/images/common/walletconnect.svg'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import Track from '@/components/common/Track'

type WcIconProps = {
  onClick: () => void
  sessionCount: number
  isError: boolean
  sessionIcon?: string
}

const WcIcon = ({ sessionCount, sessionIcon, isError, onClick }: WcIconProps): ReactElement => {
  const showIcon = sessionCount === 1 && !!sessionIcon

  return (
    <Track {...WALLETCONNECT_EVENTS.POPUP_OPENED}>
      <ButtonBase
        onClick={onClick}
        title="WalletConnect"
        sx={{
          p: '10px',
          '&:hover': {
            backgroundColor: 'background.light',
            borderRadius: '6px',
          },
        }}
      >
        <Badge
          variant={isError ? 'dot' : 'standard'}
          badgeContent={
            showIcon ? (
              <SafeAppIconCard alt="Connected dApp icon" src={sessionIcon} width={18} height={18} />
            ) : (
              sessionCount
            )
          }
          color={isError ? 'error' : showIcon ? undefined : 'secondary'}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <SvgIcon component={WalletConnectIcon} inheritViewBox fontSize="medium" />
        </Badge>
      </ButtonBase>
    </Track>
  )
}

export default WcIcon
