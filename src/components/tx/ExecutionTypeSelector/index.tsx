import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import type { Dispatch, SetStateAction, ReactElement, ChangeEvent } from 'react'

import useWallet from '@/hooks/wallets/useWallet'
import WalletIcon from '@/components/common/WalletIcon'
import SponsoredBy from '../SponsoredBy'
import RemainingRelays from '../RemainingRelays'
import type { RelayResponse } from '@/services/tx/relaying'

import css from './styles.module.css'
import BalanceInfo from '@/components/tx/BalanceInfo'
import madProps from '@/utils/mad-props'
import { useCurrentChain } from '@/hooks/useChains'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

export const enum ExecutionType {
  SCHEDULE = 'SCHEDULE',
  EXECUTE = 'EXECUTE',
}

const _ExecutionTypeSelector = ({
  wallet,
  executionType,
  setExecutionType,
  noLabel,
}: {
  wallet: ConnectedWallet | null
  chain?: ChainInfo
  executionType: ExecutionType
  setExecutionType: Dispatch<SetStateAction<ExecutionType>>
  relays?: RelayResponse
  noLabel?: boolean
  tooltip?: string
}): ReactElement | null => {

  const onChooseExecutionType = (_: ChangeEvent<HTMLInputElement>, newExecutionType: string) => {
    setExecutionType(newExecutionType as ExecutionType)
  }

  return (
    <Box className={css.container} sx={{ borderRadius: ({ shape }) => `${shape.borderRadius}px` }}>
      <div className={css.method}>
        <FormControl sx={{ display: 'flex' }}>
          {!noLabel ? (
            <Typography variant="body2" className={css.label}>
              Scheduling or executing?:
            </Typography>
          ) : null}

          <RadioGroup row value={executionType} onChange={onChooseExecutionType}>
            <FormControlLabel
              sx={{ flex: 1 }}
              value={ExecutionType.SCHEDULE}
              label={
                <Typography className={css.radioLabel}>
                  Schedule
                </Typography>
              }
              control={<Radio />}
            />

            <FormControlLabel
              data-testid="connected-wallet-execution-method"
              sx={{ flex: 1 }}
              value={ExecutionType.EXECUTE}
              label={
                <Typography className={css.radioLabel}>
                  Execute
                </Typography>
              }
              control={<Radio />}
            />
          </RadioGroup>
        </FormControl>
      </div>

      {wallet ? <BalanceInfo /> : null}
    </Box>
  )
}

export const ExecutionTypeSelector = madProps(_ExecutionTypeSelector, {
  wallet: useWallet,
  chain: useCurrentChain,
})
