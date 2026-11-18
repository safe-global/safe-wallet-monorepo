import dynamic from '@/utils/dynamic'

// Not gated: the mastercopy warning does not depend on the multichain flags
const MastercopyWarning = dynamic(() =>
  import('../../components/MastercopyWarning/MastercopyWarning').then((mod) => ({ default: mod.MastercopyWarning })),
)

export default MastercopyWarning
