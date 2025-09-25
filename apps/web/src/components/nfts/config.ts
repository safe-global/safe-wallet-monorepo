import chains from '@/config/chains'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'

type NftPlatform = {
  title: string
  logo: string
  getUrl: (nft: Collectible) => string
}

export const nftPlatforms: Record<keyof typeof chains, Array<NftPlatform>> = {
  [chains.eth]: [
    {
      title: 'Etherscan',
      logo: '/images/common/nft-etherscan.svg',
      getUrl: (item) => `https://etherscan.io/nft/${item.address}/${item.id}`,
    },
    {
      title: 'OpenSea',
      logo: '/images/common/nft-opensea.svg',
      getUrl: (item) => `https://opensea.io/assets/ethereum/${item.address}/${item.id}`,
    },
    {
      title: 'Blur',
      logo: '/images/common/nft-blur.svg',
      getUrl: (item) => `https://blur.io/asset/${item.address.toLowerCase()}/${item.id}`,
    },
    {
      title: 'Zerion',
      logo: '/images/common/nft-zerion.svg',
      getUrl: (item) => `https://app.zerion.io/nfts/ethereum/${item.address.toLowerCase()}:${item.id}`,
    },
  ],

  [chains.matic]: [
    {
      title: 'PolygonScan',
      logo: '/images/common/nft-polygonscan.svg',
      getUrl: (item) => `https://polygonscan.com/token/${item.address}?a=${item.id}`,
    },
    {
      title: 'OpenSea',
      logo: '/images/common/nft-opensea.svg',
      getUrl: (item) => `https://opensea.io/assets/matic/${item.address}/${item.id}`,
    },
    {
      title: 'Zerion',
      logo: '/images/common/nft-zerion.svg',
      getUrl: (item) => `https://app.zerion.io/nfts/polygon/${item.address.toLowerCase()}:${item.id}`,
    },
  ],

  [chains.gno]: [
    {
      title: 'GnosisScan',
      logo: '/images/common/nft-gnosisscan.svg',
      getUrl: (item) => `https://gnosisscan.io/nft/${item.address}/${item.id}`,
    },
    {
      title: 'Zerion',
      logo: '/images/common/nft-zerion.svg',
      getUrl: (item) => `https://app.zerion.io/nfts/xdai/${item.address.toLowerCase()}:${item.id}`,
    },
  ],

  [chains.gor]: [
    {
      title: 'OpenSea',
      logo: '/images/common/nft-opensea.svg',
      getUrl: (item) => `https://testnets.opensea.io/assets/goerli/${item.address}/${item.id}`,
    },
  ],

  [chains.sep]: [
    {
      title: 'OpenSea',
      logo: '/images/common/nft-opensea.svg',
      getUrl: (item) => `https://testnets.opensea.io/assets/sepolia/${item.address}/${item.id}`,
    },
  ],

  [chains.oeth]: [
    {
      title: 'OpenSea',
      logo: '/images/common/nft-opensea.svg',
      getUrl: (item) => `https://opensea.io/assets/optimism/${item.address}/${item.id}`,
    },
    {
      title: 'Zerion',
      logo: '/images/common/nft-zerion.svg',
      getUrl: (item) => `https://app.zerion.io/nfts/optimism/${item.address.toLowerCase()}:${item.id}`,
    },
  ],

  [chains.arb1]: [
    {
      title: 'OpenSea',
      logo: '/images/common/nft-opensea.svg',
      getUrl: (item) => `https://opensea.io/assets/arbitrum/${item.address}/${item.id}`,
    },
    {
      title: 'Zerion',
      logo: '/images/common/nft-zerion.svg',
      getUrl: (item) => `https://app.zerion.io/nfts/arbitrum/${item.address.toLowerCase()}:${item.id}`,
    },
  ],

  [chains.avax]: [
    {
      title: 'OpenSea',
      logo: '/images/common/nft-opensea.svg',
      getUrl: (item) => `https://opensea.io/assets/avalanche/${item.address}/${item.id}`,
    },
  ],

  [chains.bnb]: [
    {
      title: 'OpenSea',
      logo: '/images/common/nft-opensea.svg',
      getUrl: (item) => `https://opensea.io/assets/bsc/${item.address}/${item.id}`,
    },
  ],
}
