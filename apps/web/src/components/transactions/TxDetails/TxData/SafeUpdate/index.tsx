import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import DecodedData from '../DecodedData'

function SafeUpdate({ txData }: { txData?: TransactionData | null }) {
  return (
    <div className="mr-10 flex flex-col gap-4">
      <div className="bg-[var(--color-border-background)] w-full rounded p-4 text-center text-lg font-bold">
        Safe version update
      </div>

      <DecodedData txData={txData} toInfo={txData?.to} />
    </div>
  )
}

export default SafeUpdate
