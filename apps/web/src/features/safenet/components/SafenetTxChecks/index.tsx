import TxCard from '@/components/tx-flow/common/TxCard'
import GradientBoxSafenet from '../GradientBoxSafenet'
import SafenetTxSimulation from '../SafenetTxSimulation'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { Typography } from '@mui/material'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { type ReactElement } from 'react'
import css from './styles.module.css'

const SafenetTxChecks = ({ safeTx }: { safeTx: SafeTransaction }): ReactElement | null => {
  const safe = useSafeAddress()
  const chainId = useChainId()

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
