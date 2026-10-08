import ChainIndicator from '@/components/common/ChainIndicator'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NetworkLogosListView } from '@views/features/multichain/components/NetworkLogosList/NetworkLogosListView'

const NetworkLogosList = ({
  networks,
  showHasMore = false,
  maxVisible = 4,
  imageSize,
}: {
  networks: Pick<Chain, 'chainId'>[]
  showHasMore?: boolean
  maxVisible?: number
  imageSize?: number
}) => {
  return (
    <NetworkLogosListView
      networks={networks}
      showHasMore={showHasMore}
      maxVisible={maxVisible}
      imageSize={imageSize}
      renderChainIndicator={(props) => <ChainIndicator {...props} />}
    />
  )
}

export default NetworkLogosList
