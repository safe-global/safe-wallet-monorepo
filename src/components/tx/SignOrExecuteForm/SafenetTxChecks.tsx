import { Typography } from '@mui/material'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { type ReactElement } from 'react'
import GradientBoxSafenet from '@/components/common/GradientBoxSafenet'
import { SafenetTxSimulation } from '@/components/tx/security/safenet'
import TxCard from '@/components/tx-flow/common/TxCard'
import useIsSafenetEnabled from '@/hooks/useIsSafenetEnabled'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import css from './styles.module.css'

const SafenetTxChecks = ({ safeTx }: { safeTx: SafeTransaction }): ReactElement | null => {
  const safe = useSafeAddress()
  const chainId = useChainId()
  const isSafenetEnabled = useIsSafenetEnabled()

  if (!isSafenetEnabled) {
    return null
  }

  return (
    <GradientBoxSafenet className={css.safenetGradientCard}>
      <TxCard>
        <Typography variant="h5">Safenet checks</Typography>
        <SafenetTxSimulation safe={safe} chainId={chainId} safeTx={safeTx} />
      </TxCard>
    </GradientBoxSafenet>
  )
}

export default SafenetTxChecks
