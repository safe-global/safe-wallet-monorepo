import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import StepLabel from '@mui/material/StepLabel'
import SvgIcon from '@mui/material/SvgIcon'
import css from '@/components/new-safe/create/steps/StatusStep/styles.module.css'
import CircleIcon from '@mui/icons-material/Circle'
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined'
import Identicon from '@/components/common/Identicon'

const StatusStep = ({
  isLoading,
  safeAddress,
  children,
}: {
  isLoading: boolean
  safeAddress?: string
  children: ReactNode
}) => {
  const Icon = isLoading ? CircleOutlinedIcon : CircleIcon
  const color = isLoading ? 'border' : 'primary'

  return (
    <StepLabel
      className={css.label}
      icon={<SvgIcon component={Icon} className={css.icon} color={color} fontSize="small" />}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: ({ palette }) => (isLoading ? palette.border.main : palette.text.primary),
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
          }}
        >
          {safeAddress && !isLoading ? (
            <Identicon address={safeAddress} size={32} />
          ) : (
            <Skeleton variant="circular" width="2.3em" height="2.3em" />
          )}
        </Box>
        {children}
      </Box>
    </StepLabel>
  )
}

export default StatusStep
