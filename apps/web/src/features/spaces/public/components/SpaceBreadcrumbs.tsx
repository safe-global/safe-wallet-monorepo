import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceBreadcrumbs = dynamic(() => import('../../components/SpaceBreadcrumbs'))

export default SpaceBreadcrumbs
