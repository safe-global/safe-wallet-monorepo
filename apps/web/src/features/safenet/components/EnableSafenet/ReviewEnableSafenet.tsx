import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import { Errors, logError } from '@/services/exceptions'
import { createEnableGuardTx, createEnableModuleTx, createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { Typography } from '@mui/material'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { useContext, useEffect } from 'react'
import { type EnableSafenetFlowProps } from './EnableSafenetFlow'

const ReviewEnableSafenet = ({ params }: { params: EnableSafenetFlowProps }) => {
  const { setSafeTx, safeTxError, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    async function getTxs(): Promise<SafeTransaction> {
      const txs: MetaTransactionData[] = [
        (await createEnableModuleTx(params.moduleAddress)).data,
        (await createEnableGuardTx(params.guardAddress)).data,
      ]

      return createMultiSendCallOnlyTx(txs)
    }

    getTxs().then(setSafeTx).catch(setSafeTxError)
  }, [setSafeTx, setSafeTxError, params.guardAddress, params.moduleAddress])

  useEffect(() => {
    if (safeTxError) {
      logError(Errors._807, safeTxError.message)
    }
  }, [safeTxError])

  return (
    <SignOrExecuteForm>
      <Typography sx={({ palette }) => ({ color: palette.primary.light })}>Module</Typography>
      <EthHashInfo address={params.moduleAddress} showCopyButton hasExplorer shortAddress={false} />

      <Typography sx={({ palette }) => ({ color: palette.primary.light })}>Transaction guard</Typography>
      <EthHashInfo address={params.guardAddress} showCopyButton hasExplorer shortAddress={false} />

      <Typography my={2}>
        Once the module and transaction guard have been enabled, Safenet will be enabled for your Safe.
      </Typography>
    </SignOrExecuteForm>
  )
}

export default ReviewEnableSafenet
