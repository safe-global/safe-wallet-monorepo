import dynamic from '@/utils/dynamic'

// Not gated: the assets feature is always enabled
const AssetsList = dynamic(() => import('../../components/AssetsList'))

export default AssetsList
