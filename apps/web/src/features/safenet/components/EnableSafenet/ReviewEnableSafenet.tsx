import { useContext, useEffect } from 'react'
import { Typography } from '@mui/material'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Errors, logError } from '@/services/exceptions'
import { createEnableGuardTx, createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { type EnableSafenetFlowProps } from '.'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import { ERC20__factory } from '@/types/contracts'
import { UNLIMITED_APPROVAL_AMOUNT } from '@/utils/tokens'

const ERC20_INTERFACE = ERC20__factory.createInterface()

const ReviewEnableSafenet = ({ params }: { params: EnableSafenetFlowProps }) => {
  const { setSafeTx, safeTxError, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    async function getTxs(): Promise<SafeTransaction> {
      if (params.tokensForPresetAllowances.length === 0) {
        return createEnableGuardTx(params.guardAddress)
      }

      const txs: MetaTransactionData[] = [(await createEnableGuardTx(params.guardAddress)).data]
      params.tokensForPresetAllowances.forEach((tokenAddress) => {
        txs.push({
          to: tokenAddress,
          data: ERC20_INTERFACE.encodeFunctionData('approve', [params.allowanceSpender, UNLIMITED_APPROVAL_AMOUNT]),
          value: '0',
          operation: OperationType.Call,
        })
      })

      return createMultiSendCallOnlyTx(txs)
    }

    getTxs().then(setSafeTx).catch(setSafeTxError)
  }, [setSafeTx, setSafeTxError, params.allowanceSpender, params.tokensForPresetAllowances, params.guardAddress])

  useEffect(() => {
    if (safeTxError) {
      logError(Errors._807, safeTxError.message)
    }
  }, [safeTxError])

  return (
    <SignOrExecuteForm>
      <Typography sx={({ palette }) => ({ color: palette.primary.light })}>Transaction guard</Typography>

      <EthHashInfo address={params.guardAddress} showCopyButton hasExplorer shortAddress={false} />

      <Typography my={2}>
        Once the transaction guard has been enabled, Safenet will be enabled for your Safe.
      </Typography>
    </SignOrExecuteForm>
  )
}

export default ReviewEnableSafenet
