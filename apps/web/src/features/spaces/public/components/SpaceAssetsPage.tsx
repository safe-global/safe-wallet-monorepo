import dynamic from '@/utils/dynamic'

// Not gated: the page redirects itself when SPACE_ASSETS is off
const SpaceAssetsPage = dynamic(() => import('../../components/SpaceAssets/Page'))

export default SpaceAssetsPage
