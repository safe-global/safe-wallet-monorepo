import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { useContext, useMemo } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { MasterCopy } from '@/hooks/useMasterCopies'
import { MasterCopyDeployer, useMasterCopies } from '@/hooks/useMasterCopies'
import useSafeInfo from '@/hooks/useSafeInfo'
import { CircleCheckIcon } from 'lucide-react'
import InfoIcon from '@/public/images/notifications/info.svg'
import { TxModalContext } from '@/components/tx-flow'
import { UpdateSafeFlow } from '@/components/tx-flow/flows'
import ExternalLink from '@/components/common/ExternalLink'
import CheckWallet from '@/components/common/CheckWallet'
import { useCurrentChain } from '@/hooks/useChains'
import { UnsupportedMastercopyWarning } from '@/features/multichain'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

/**
 * Generates a GitHub release URL for a specific Safe contract version.
 * Strips L2 suffix if present (e.g., "1.3.0+L2" → "v1.3.0").
 * @param version - The Safe contract version (e.g., "1.4.1" or "1.3.0+L2")
 * @returns GitHub release URL (e.g., "https://github.com/safe-fndn/safe-smart-account/releases/tag/v1.4.1")
 */
const getReleaseUrl = (version: string): string => {
  const cleanVersion = version.split('+')[0]
  return `https://github.com/safe-fndn/safe-smart-account/releases/tag/v${cleanVersion}`
}

export const ContractVersion = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const [masterCopies] = useMasterCopies()
  const { safe, safeLoaded } = useSafeInfo()
  const currentChain = useCurrentChain()
  const masterCopyAddress = safe.implementation.value

  const safeMasterCopy: MasterCopy | undefined = useMemo(() => {
    return masterCopies?.find((mc) => sameAddress(mc.address, masterCopyAddress))
  }, [masterCopies, masterCopyAddress])

  const needsUpdate = safe.implementationVersionState === ImplementationVersionState.OUTDATED
  const showUpdateDialog = safeMasterCopy?.deployer === MasterCopyDeployer.GNOSIS && needsUpdate
  const isLatestVersion = safe.version && !showUpdateDialog

  const latestSafeVersion = getLatestSafeVersion(currentChain)

  const releaseUrl = safe.version ? getReleaseUrl(safe.version) : undefined

  return (
    <>
      <Typography variant="h4" className="mb-2">
        Contract version
      </Typography>

      {/* as="div": the Skeleton renders a div, which is invalid inside the default <p> */}
      <Typography as="div" className="flex items-center">
        {safeLoaded ? (
          <>
            {safe.version ?? 'Unsupported contract'}
            {isLatestVersion && (
              <>
                <CircleCheckIcon className="ml-2 mr-1 size-5 text-primary" /> Latest version
              </>
            )}
          </>
        ) : (
          <Skeleton className="h-5 w-[60px]" />
        )}
      </Typography>

      {safeLoaded && releaseUrl && (
        <Typography variant="paragraph-small" className="block mt-1">
          <ExternalLink href={releaseUrl}>View release</ExternalLink>
        </Typography>
      )}

      <div className="mt-4">
        {safeLoaded && safe.version && showUpdateDialog ? (
          <Alert>
            <InfoIcon className="size-4 text-[var(--color-secondary-main)]" />
            <AlertTitle>
              New version is available: {latestSafeVersion} (
              <ExternalLink href={safeMasterCopy?.deployerRepoUrl}>changelog</ExternalLink>)
            </AlertTitle>

            <AlertDescription>
              <p>
                Update now to take advantage of new features and the highest security standards available. You will need
                to confirm this update just like any other transaction.
              </p>

              <CheckWallet>
                {(isOk) => (
                  <Button onClick={() => setTxFlow(<UpdateSafeFlow />)} disabled={!isOk}>
                    Update
                  </Button>
                )}
              </CheckWallet>
            </AlertDescription>
          </Alert>
        ) : (
          <UnsupportedMastercopyWarning />
        )}
      </div>
    </>
  )
}
