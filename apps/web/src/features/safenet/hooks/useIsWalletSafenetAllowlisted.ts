import useWallet from '@/hooks/wallets/useWallet'
import { useDeploySafenetAccountQuery } from '@/store/safenet'
import { QueryStatus } from '@reduxjs/toolkit/query/react'
import { useMemo } from 'react'
import useHasSafenetFeature from './useHasSafenetFeature'

/**
 * Checks if the connected wallet is allowlisted in the Safenet Processor API to deploy Safenet-enabled Safes
 * @returns {boolean} Whether the wallet is allowlisted
 */
const useIsWalletSafenetAllowlisted = () => {
  const wallet = useWallet()
  const hasSafenetFeature = useHasSafenetFeature()

  const safeDeploymentProps = useMemo(() => {
    return {
      account: {
        owners: wallet?.address ? [wallet.address] : [],
        threshold: 1,
      },
      saltNonce: Date.now().toString(),
      dryRun: true,
    }
  }, [wallet?.address])

  const { status: safenetDeployDryRunStatus } = useDeploySafenetAccountQuery(safeDeploymentProps, {
    skip: !hasSafenetFeature,
  })

  return safenetDeployDryRunStatus === QueryStatus.fulfilled
}

export default useIsWalletSafenetAllowlisted
