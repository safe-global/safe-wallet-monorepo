import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import NftIcon from '@/public/images/common/nft.svg'
import SendNftBatch from './SendNftBatch'
import ReviewNftBatch from './ReviewNftBatch'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'

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
    subtitle="Send NFTs"
    eventCategory={TxFlowType.NFT_TRANSFER}
    ReviewTransactionComponent={ReviewNftBatch}
  >
    <TxFlowStep title="New transaction">
      <SendNftBatch />
    </TxFlowStep>
  </TxFlow>
)

export default NftTransferFlow
