import { isTxSimulationEnabled } from '@/components/tx/security/tenderly/utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { type ReactElement } from 'react'
import { TxSimulation, TxSimulationMessage } from '@/components/tx/security/tenderly'
import TxCard from '@/components/tx-flow/common/TxCard'
import { Alert, Box, Typography } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import type { SafeTransaction, MetaTransactionData } from '@safe-global/safe-core-sdk-types'

import css from './styles.module.css'

const SAFE_UTILS_URL = 'https://safeutils.openzeppelin.com/'

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

      <Alert severity="info">
        We recommend analyzing your transaction with a third-party tool like{' '}
        <Track {...MODALS_EVENTS.OPEN_SAFE_UTILS}>
          <ExternalLink href={SAFE_UTILS_URL}>Safe Utils</ExternalLink>
        </Track>
        . Third-party terms & disclaimers may apply.
      </Alert>

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
