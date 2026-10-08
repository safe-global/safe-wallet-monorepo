import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import NftIcon from '@/public/images/common/nft.svg'
import SendNftBatch from './SendNftBatch'
import ReviewNftBatch from './ReviewNftBatch'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import { NFT_TRANSFER_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/NftTransfer/copy'

export type NftTransferParams = {
  recipient: string
  tokens: Collectible[]
}

type NftTransferFlowProps = Partial<NftTransferParams>

const defaultParams: NftTransferParams = {
  recipient: '',
  tokens: [],
}

const NftTransferFlow = (params: NftTransferFlowProps) => (
  <TxFlow
    initialData={{
      ...defaultParams,
      ...params,
    }}
    icon={NftIcon}
    subtitle={COPY.subtitle}
    eventCategory={TxFlowType.NFT_TRANSFER}
    ReviewTransactionComponent={ReviewNftBatch}
  >
    <TxFlowStep title={COPY.stepTitle}>
      <SendNftBatch />
    </TxFlowStep>
  </TxFlow>
)

export default NftTransferFlow
