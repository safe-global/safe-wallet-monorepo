import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnActivatedSettingsBanner = gatedDynamic(FEATURES.HYPERNATIVE, () =>
  import('../components/HnActivatedSettingsBanner').then((mod) => ({ default: mod.HnActivatedBannerForSettings })),
)

export default HnActivatedSettingsBanner
