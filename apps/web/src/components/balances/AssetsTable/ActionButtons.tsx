import React, { type ReactElement } from 'react'
import { Box, Stack } from '@mui/material'
import SendButton from './SendButton'
import SwapButton from '@/features/swap/components/SwapButton'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import css from './styles.module.css'

interface ActionButtonsProps {
  tokenInfo: Balance['tokenInfo']
  isSwapFeatureEnabled: boolean
  onlyIcon?: boolean
  mobile?: boolean
}

export const ActionButtons = ({
  tokenInfo,
  isSwapFeatureEnabled,
  onlyIcon = false,
  mobile = false,
}: ActionButtonsProps): ReactElement => {
  if (mobile) {
    return (
      <Stack direction="row" className={css.mobileButtons}>
        <Box className={css.mobileButtonWrapper}>
          <SendButton tokenInfo={tokenInfo} />
        </Box>

        {isSwapFeatureEnabled && (
          <Box className={css.mobileButtonWrapper}>
            <SwapButton tokenInfo={tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} />
          </Box>
        )}
      </Stack>
    )
  }

  return (
    <Stack
      direction="row"
      gap={1}
      alignItems="center"
      justifyContent="flex-end"
      mr={-1}
      className={onlyIcon ? css.sticky : undefined}
    >
      <SendButton tokenInfo={tokenInfo} onlyIcon={onlyIcon} />

      {isSwapFeatureEnabled && (
        <SwapButton tokenInfo={tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} onlyIcon={onlyIcon} />
      )}
    </Stack>
  )
}
