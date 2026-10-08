import type { NextPage } from 'next'
import Head from 'next/head'
import { ContractVersion } from '@/components/settings/ContractVersion'
import { OwnerList } from '@/components/settings/owner/OwnerList'
import { RequiredConfirmation } from '@/components/settings/RequiredConfirmations'
import useSafeInfo from '@/hooks/useSafeInfo'
import SettingsHeader from '@/components/settings/SettingsHeader'
import ProposersList from '@/components/settings/ProposersList'
import { SpendingLimitsFeature } from '@/features/spending-limits'
import { useLoadFeature } from '@/features/__core__'
import { BRAND_NAME } from '@/config/constants'
import { NestedSafesList } from '@/components/settings/NestedSafesList'
import { FeeTokenPreference } from '@/components/settings/FeeTokenPreference'
import { SetupView } from '@views/pages/settings/SetupView'

const Setup: NextPage = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const { SpendingLimitsSettings } = useLoadFeature(SpendingLimitsFeature)
  const nonce = safe.nonce
  const ownerLength = safe.owners.length
  const threshold = safe.threshold

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Settings – Setup`}</title>
      </Head>

      <SettingsHeader />

      <SetupView
        safeLoaded={safeLoaded}
        nonce={nonce}
        contractVersion={<ContractVersion />}
        ownerList={<OwnerList />}
        proposersList={<ProposersList />}
        requiredConfirmation={<RequiredConfirmation threshold={threshold} owners={ownerLength} />}
      >
        <SpendingLimitsSettings />

        <NestedSafesList />

        <FeeTokenPreference />
      </SetupView>
    </>
  )
}

export default Setup
