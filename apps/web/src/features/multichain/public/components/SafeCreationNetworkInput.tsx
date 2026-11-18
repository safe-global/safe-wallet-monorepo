import dynamic from '@/utils/dynamic'

// Not gated: it checks the multichain flags of each target chain, not of the current chain
const SafeCreationNetworkInput = dynamic(() => import('../../components/SafeCreationNetworkInput'))

export default SafeCreationNetworkInput
