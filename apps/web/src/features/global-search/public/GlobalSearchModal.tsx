import dynamic from '@/utils/dynamic'

// Not gated: the global-search feature is always enabled
const GlobalSearchModal = dynamic(() => import('../components/GlobalSearchModal/GlobalSearchModal'))

export default GlobalSearchModal
