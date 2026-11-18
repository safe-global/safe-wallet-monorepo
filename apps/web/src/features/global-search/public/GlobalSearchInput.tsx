import dynamic from '@/utils/dynamic'

// Not gated: the global-search feature is always enabled
const GlobalSearchInput = dynamic(() => import('../components/GlobalSearchInput'))

export default GlobalSearchInput
