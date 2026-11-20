import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SelectSafeModal = dynamic(() => import('../../components/SelectSafeModal'))

export default SelectSafeModal
