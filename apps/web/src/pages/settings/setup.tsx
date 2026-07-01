import type { NextPage } from 'next'
import Head from 'next/head'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import { ContractVersion } from '@/components/settings/ContractVersion'
import { OwnerList } from '@/components/settings/owner/OwnerList'
import { RequiredConfirmation } from '@/components/settings/RequiredConfirmations'
import useSafeInfo from '@/hooks/useSafeInfo'
import SettingsHeader from '@/components/settings/SettingsHeader'
import ProposersList from 'src/components/settings/ProposersList'
import { SpendingLimitsFeature } from '@/features/spending-limits'
import { useLoadFeature } from '@/features/__core__'
import { BRAND_NAME } from '@/config/constants'
import { NestedSafesList } from '@/components/settings/NestedSafesList'
import { FeeTokenPreference } from '@/components/settings/FeeTokenPreference'

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

      <main>
        <div data-testid="setup-section" className="mb-4 rounded-lg bg-[var(--color-background-paper)] p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <Typography variant="h4">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span>
                        Safe account nonce
                        <InfoIcon className="ml-1 inline size-5 align-middle text-[var(--color-border-main)]" />
                      </span>
                    }
                  />
                  <TooltipContent>
                    For security reasons, transactions made with a Safe account need to be executed in order. The nonce
                    shows you which transaction will be executed next. You can find the nonce for a transaction in the
                    transaction details.
                  </TooltipContent>
                </Tooltip>
              </Typography>

              <Typography className="pt-2">
                Current nonce: {safeLoaded ? <b>{nonce}</b> : <Skeleton className="inline-block h-4 w-[30px]" />}
              </Typography>
            </div>

            <div>
              <ContractVersion />
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-[var(--color-background-paper)] p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <Typography variant="h4">Members</Typography>
            </div>

            <div>
              <div className="flex flex-col gap-4">
                <OwnerList />
                <ProposersList />
              </div>
            </div>
          </div>

          <RequiredConfirmation threshold={threshold} owners={ownerLength} />
        </div>

        <SpendingLimitsSettings />

        <NestedSafesList />

        <FeeTokenPreference />
      </main>
    </>
  )
}

export default Setup
