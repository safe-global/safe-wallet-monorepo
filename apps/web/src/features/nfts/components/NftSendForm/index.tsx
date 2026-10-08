import type { ReactElement } from 'react'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import CheckWallet from '@/components/common/CheckWallet'
import { NftSendFormView } from '@views/features/nfts/components/NftSendForm/NftSendFormView'

type NftSendFormProps = {
  selectedNfts: Collectible[]
}

const NftSendForm = ({ selectedNfts }: NftSendFormProps): ReactElement => {
  return (
    <NftSendFormView
      selectedCount={selectedNfts.length}
      renderCheckWallet={(children) => <CheckWallet>{children}</CheckWallet>}
    />
  )
}

export default NftSendForm
