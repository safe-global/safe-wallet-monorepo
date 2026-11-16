import RecoverySettings from '@/features/recovery/public/RecoverySettings'
import SecuritySettings from '../SecuritySettings'
import { useRouter } from 'next/router'
import { HnBannerForSettings } from '@/features/hypernative/public/HnBanner'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import HnActivatedSettingsBanner from '@/features/hypernative/public/HnActivatedSettingsBanner'

const SecurityLogin = () => {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-4">
      {/* If guard is active: 
      HnActivatedSettingsBanner shows, 
      HnBannerForSettings doesn't - useBannerVisibility already ensures mutual exclusivity */}
      <HnActivatedSettingsBanner />
      <HnBannerForSettings isDismissable={false} label={HYPERNATIVE_SOURCE.Settings} />

      {router.query.safe ? <RecoverySettings /> : null}

      <SecuritySettings />
    </div>
  )
}

export default SecurityLogin
