import { type ReactElement, useContext } from 'react'
import { SafenetTxSimulation } from '@/components/tx/security/safenet'
import TxCard from '@/components/tx-flow/common/TxCard'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useIsSafenetEnabled from '@/hooks/useIsSafenetEnabled'
import { Typography } from '@mui/material'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'

const SafenetTxChecks = (): ReactElement | null => {
  const safe = useSafeAddress()
  const chainId = useChainId()
  const { safeTx } = useContext(SafeTxContext)
  const isSafenetEnabled = useIsSafenetEnabled()

  if (!isSafenetEnabled) {
    return null
  }

  return (
    <TxCard>
      <Typography variant="h5">Safenet checks</Typography>

      <SafenetTxSimulation safe={safe} chainId={chainId} safeTx={safeTx} />
    </TxCard>
  )
}

export default SafenetTxChecks
