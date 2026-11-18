import RecoverySettings from '@/features/recovery/public/RecoverySettings'
import SecuritySettings from '../SecuritySettings'
import { useRouter } from 'next/router'
import { HnBannerForSettings } from '@/features/hypernative/components/HnBanner'
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

const SecurityLogin = () => {
  const router = useRouter()
  const hn = useLoadFeature(HypernativeFeature)

  return (
    <div className="flex flex-col gap-4">
      {/* If guard is active: 
      HnActivatedSettingsBanner shows, 
      HnBannerForSettings doesn't - useBannerVisibility already ensures mutual exclusivity */}
      <hn.HnActivatedSettingsBanner />
      <HnBannerForSettings isDismissable={false} label={HYPERNATIVE_SOURCE.Settings} />

      {router.query.safe ? <RecoverySettings /> : null}

      <SecuritySettings />
    </div>
  )
}

export default SecurityLogin
