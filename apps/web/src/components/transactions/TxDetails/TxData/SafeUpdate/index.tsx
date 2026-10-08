import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import DecodedData from '../DecodedData'
import { SafeUpdateView } from '@views/components/transactions/TxDetails/TxData/SafeUpdate/SafeUpdateView'

function SafeUpdate({ txData }: { txData?: TransactionData | null }) {
  return <SafeUpdateView decodedData={<DecodedData txData={txData} toInfo={txData?.to} />} />
}

export default SafeUpdate
