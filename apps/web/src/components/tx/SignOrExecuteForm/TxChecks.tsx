import { isTxSimulationEnabled } from '@/components/tx/security/tenderly/utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { type ReactElement } from 'react'
import { TxSimulation, TxSimulationMessage } from '@/components/tx/security/tenderly'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Box, Typography } from '@mui/material'

import type { SafeTransaction, MetaTransactionData } from '@safe-global/safe-core-sdk-types'

import css from './styles.module.css'
import { FEATURES } from '@safe-global/utils/utils/chains'

const TxChecks = ({
  executionOwner,
  disabled = false,
  transaction,
}: {
  executionOwner?: string
  disabled?: boolean
  transaction: SafeTransaction | Array<MetaTransactionData>
}): ReactElement | null => {
  const chain = useCurrentChain()
  const isRiskMitigationFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)
  const isTxSimulationFeatureEnabled = isTxSimulationEnabled(chain)

  return (
    <TxCard>
      <Typography variant="h5">Transaction checks</Typography>

      {(isTxSimulationFeatureEnabled || isRiskMitigationFeatureEnabled) && (
        <>
          <TxSimulation disabled={disabled} transactions={transaction} executionOwner={executionOwner} />

          <Box className={css.mobileTxCheckMessages}>
            <TxSimulationMessage />
          </Box>
        </>
      )}
    </TxCard>
  )
}

export default TxChecks
