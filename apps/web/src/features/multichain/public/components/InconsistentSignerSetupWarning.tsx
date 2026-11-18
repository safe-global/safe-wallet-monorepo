import dynamic from '@/utils/dynamic'

// Not gated: it warns about a Safe deployed on several chains, whatever the creation flags are
const InconsistentSignerSetupWarning = dynamic(() =>
  import('../../components/SignerSetupWarning/InconsistentSignerSetupWarning').then((mod) => ({
    default: mod.InconsistentSignerSetupWarning,
  })),
)

export default InconsistentSignerSetupWarning
