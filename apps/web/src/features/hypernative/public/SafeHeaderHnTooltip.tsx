import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafeHeaderHnTooltip = gatedDynamic(FEATURES.HYPERNATIVE, () =>
  import('../components/SafeHeaderHnTooltip/SafeHeaderHnTooltip').then((mod) => ({ default: mod.SafeHeaderHnTooltip })),
)

export default SafeHeaderHnTooltip
