import dynamic from '@/utils/dynamic'

// Not gated: it checks the multichain flags of each target chain, not of the current chain
const CreateSafeOnSpecificChain = dynamic(() =>
  import('../../components/CreateSafeOnNewChain').then((mod) => ({ default: mod.CreateSafeOnSpecificChain })),
)

export default CreateSafeOnSpecificChain
