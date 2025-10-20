import type { Relay } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'

import type { Dispatch, SetStateAction, ReactElement, ChangeEvent } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import WalletIcon from '@/components/common/WalletIcon'
import SponsoredBy from '../SponsoredBy'

import RemainingRelays from '../RemainingRelays'
import css from './styles.module.css'
import BalanceInfo from '@/components/tx/BalanceInfo'
import madProps from '@/utils/mad-props'
import { useCurrentChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

export const enum ExecutionMethod {
  RELAY = 'RELAY',
  WALLET = 'WALLET',
}

const _ExecutionMethodSelector = ({
  wallet,
  chain,
  executionMethod,
  setExecutionMethod,
  relays,
  noLabel,
  tooltip,
}: {
  wallet: ConnectedWallet | null
  chain?: Chain
  executionMethod: ExecutionMethod
  setExecutionMethod: Dispatch<SetStateAction<ExecutionMethod>>
  relays?: Relay
  noLabel?: boolean
  tooltip?: string
}): ReactElement | null => {
  const shouldRelay = executionMethod === ExecutionMethod.RELAY

  const onChooseExecutionMethod = (_: ChangeEvent<HTMLInputElement>, newExecutionMethod: string) => {
    setExecutionMethod(newExecutionMethod as ExecutionMethod)
  }

  return (
    <Box className={css.container} sx={{ borderRadius: ({ shape }) => `${shape.borderRadius}px` }}>
      <div className={css.method}>
        <FormControl sx={{ display: 'flex' }}>
          {!noLabel ? (
            <Typography variant="body2" className={css.label}>
              Who will pay gas fees:
            </Typography>
          ) : null}

          <RadioGroup row value={executionMethod} onChange={onChooseExecutionMethod}>
            <FormControlLabel
              data-testid="relay-execution-method"
              sx={{ flex: 1 }}
              value={ExecutionMethod.RELAY}
              label={
                <Typography className={css.radioLabel} whiteSpace="nowrap">
                  Sponsored by
                  <SponsoredBy chainId={chain?.chainId ?? ''} />
                </Typography>
              }
              control={<Radio />}
            />

            <FormControlLabel
              data-testid="connected-wallet-execution-method"
              sx={{ flex: 1 }}
              value={ExecutionMethod.WALLET}
              label={
                <Typography className={css.radioLabel}>
                  <WalletIcon provider={wallet?.label || ''} width={20} height={20} icon={wallet?.icon} /> Connected
                  wallet
                </Typography>
              }
              control={<Radio />}
            />
          </RadioGroup>
        </FormControl>
      </div>

      {shouldRelay && relays ? <RemainingRelays relays={relays} tooltip={tooltip} /> : wallet ? <BalanceInfo /> : null}
    </Box>
  )
}

export const ExecutionMethodSelector = madProps(_ExecutionMethodSelector, {
  wallet: useWallet,
  chain: useCurrentChain,
})
