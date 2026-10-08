import type {
  NativeStakingDepositTransactionInfo,
  TransactionData,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import StakingConfirmationTxDeposit from './StakingConfirmationTxDeposit'
import { StakingTxDepositDetailsView } from '@views/components/transactions/TxDetails/TxData/Staking/StakingTxDepositDetailsView'

const StakingTxDepositDetails = ({
  info,
  txData,
}: {
  info: NativeStakingDepositTransactionInfo
  txData?: TransactionData | null
}) => {
  return (
    <StakingTxDepositDetailsView
      info={info}
      hasTxData={!!txData}
      renderSendAmountBlock={({ title }) =>
        txData && (
          <SendAmountBlock title={title} amountInWei={txData.value?.toString() || '0'} tokenInfo={info.tokenInfo} />
        )
      }
      confirmation={<StakingConfirmationTxDeposit order={info} isTxDetails />}
    />
  )
}

export default StakingTxDepositDetails
