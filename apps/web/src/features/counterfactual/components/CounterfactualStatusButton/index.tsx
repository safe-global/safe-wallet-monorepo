import { selectUndeployedSafe } from '../../store/undeployedSafesSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import { useAppSelector } from '@/store'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { IconButton, Tooltip, type SvgIconProps } from '@mui/material'
import classnames from 'classnames'
import css from './styles.module.css'

export const LoopIcon = (props: SvgIconProps) => {
  return (
    <AutorenewRoundedIcon
      {...props}
      sx={{
        ...props.sx,
        animation: 'spin 2s linear infinite',
        '@keyframes spin': {
          '0%': {
            transform: 'rotate(0)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      }}
    />
  )
}

const CounterfactualStatusButton = () => {
  const { safe, safeAddress } = useSafeInfo()
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, safe.chainId, safeAddress))

  if (safe.deployed) return null

  const isActivating = undeployedSafe?.status.status !== 'AWAITING_EXECUTION'

  return (
    <Tooltip
      placement="right"
      title={isActivating ? 'Safe Account is being activated' : 'Safe Account is not activated'}
      arrow
    >
      <IconButton
        data-testid="pending-activation-icon"
        className={classnames(css.statusButton, { [css.processing]: isActivating })}
        size="small"
        color={isActivating ? 'info' : 'warning'}
        disableRipple
      >
        {isActivating ? <LoopIcon /> : <InfoIcon />}
      </IconButton>
    </Tooltip>
  )
}

export default CounterfactualStatusButton
