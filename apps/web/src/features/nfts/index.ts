import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { NftsContract } from './contract'

export const NftsFeature = createFeatureHandle<NftsContract>('nfts', FEATURES.ERC721)

export { default as NftsPage } from './components/NftsPage'
