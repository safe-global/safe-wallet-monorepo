import dynamic from '@/utils/dynamic'

// Not gated: a plain list of chain logos that other features show on every chain
const ChainIndicatorList = dynamic(() =>
  import('../components/SignerSetupWarning/InconsistentSignerSetupWarning').then((mod) => ({
    default: mod.ChainIndicatorList,
  })),
)

export default ChainIndicatorList
