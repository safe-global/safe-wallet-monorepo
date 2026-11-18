import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SupportChatDrawer = gatedDynamic(FEATURES.SUPPORT_CHAT, () => import('../components/SupportChatDrawer'))

export default SupportChatDrawer
