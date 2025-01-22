import GradientBoxSafenet from '@/components/common/GradientBoxSafenet'
import TxCard from '@/components/tx-flow/common/TxCard'
import { SafenetTxSimulation } from '@/components/tx/security/safenet'
import { IS_SAFENET_ENABLED } from '@/config/constants'
import useChainId from '@/hooks/useChainId'
import useIsSafenetEnabled from '@/hooks/useIsSafenetEnabled'
import useSafeAddress from '@/hooks/useSafeAddress'
import { Typography } from '@mui/material'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { type ReactElement } from 'react'
import css from './styles.module.css'

const SafenetTxChecks = ({ safeTx }: { safeTx: SafeTransaction }): ReactElement | null => {
  const safe = useSafeAddress()
  const chainId = useChainId()
  const isSafenetEnabled = useIsSafenetEnabled()

  if (!isSafenetEnabled) {
    return null
  }

  const txCard = (
    <TxCard>
      <Typography variant="h5">Safenet checks</Typography>
      <SafenetTxSimulation safe={safe} chainId={chainId} safeTx={safeTx} />
    </TxCard>
  )
  return IS_SAFENET_ENABLED ? (
    <GradientBoxSafenet className={css.safenetGradientCard}>{txCard}</GradientBoxSafenet>
  ) : (
    txCard
  )
}

export default SafenetTxChecks
