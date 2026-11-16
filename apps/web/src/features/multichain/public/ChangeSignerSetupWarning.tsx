import dynamic from '@/utils/dynamic'

// Not gated: it warns about a Safe deployed on several chains, whatever the creation flags are
const ChangeSignerSetupWarning = dynamic(() =>
  import('../components/SignerSetupWarning/ChangeSignerSetupWarning').then((mod) => ({
    default: mod.ChangeSignerSetupWarning,
  })),
)

export default ChangeSignerSetupWarning
