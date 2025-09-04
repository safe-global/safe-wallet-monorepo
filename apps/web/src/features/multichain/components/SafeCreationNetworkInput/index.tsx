import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useCallback, useEffect, type ReactElement } from 'react'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useRouter } from 'next/router'
import { getNetworkLink } from '@/components/common/NetworkSelector'
import { SetNameStepFields } from '@/components/new-safe/create/steps/SetNameStep'
import { getSafeSingletonDeployments, getSafeToL2SetupDeployments } from '@safe-global/safe-deployments'
import { hasCanonicalDeployment } from '@safe-global/utils/services/contracts/deployments'
import { hasMultiChainCreationFeatures } from '@/features/multichain/utils/utils'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'

const SafeCreationNetworkInput = ({
  name,
  isAdvancedFlow = false,
}: {
  name: string
  isAdvancedFlow?: boolean
}): ReactElement => {
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const currentChain = useCurrentChain()
  const { currentSafeApp } = useSafeApps()

  const {
    formState: { errors },
    control,
  } = useFormContext()

  const selectedNetworks: ChainInfo[] = useWatch({ control, name: SetNameStepFields.networks })

  const updateCurrentNetwork = useCallback(
    (chains: ChainInfo[]) => {
      if (chains.length !== 1) return
      const networkLink = getNetworkLink(router, safeAddress, chains[0], currentSafeApp)
      router.replace(networkLink)
    },
    [router, safeAddress, currentSafeApp],
  )

  const isOptionDisabled = useCallback(
    (optionNetwork: ChainInfo) => {
      // Initially all networks are always available
      if (selectedNetworks.length === 0) {
        return false
      }

      const firstSelectedNetwork = selectedNetworks[0]

      // do not allow multi chain safes for advanced setup flow.
      if (isAdvancedFlow) return optionNetwork.chainId != firstSelectedNetwork.chainId

      // Check required feature toggles
      const optionIsSelectedNetwork = firstSelectedNetwork.chainId === optionNetwork.chainId
      if (!hasMultiChainCreationFeatures(optionNetwork) || !hasMultiChainCreationFeatures(firstSelectedNetwork)) {
        return !optionIsSelectedNetwork
      }

      // Check if required deployments are available
      const optionHasCanonicalSingletonDeployment =
        hasCanonicalDeployment(
          getSafeSingletonDeployments({
            network: optionNetwork.chainId,
            version: getLatestSafeVersion(firstSelectedNetwork),
          }),
          optionNetwork.chainId,
        ) &&
        hasCanonicalDeployment(
          getSafeToL2SetupDeployments({ network: optionNetwork.chainId, version: '1.4.1' }),
          optionNetwork.chainId,
        )

      const selectedHasCanonicalSingletonDeployment =
        hasCanonicalDeployment(
          getSafeSingletonDeployments({
            network: firstSelectedNetwork.chainId,
            version: getLatestSafeVersion(firstSelectedNetwork),
          }),
          firstSelectedNetwork.chainId,
        ) &&
        hasCanonicalDeployment(
          getSafeToL2SetupDeployments({ network: firstSelectedNetwork.chainId, version: '1.4.1' }),
          firstSelectedNetwork.chainId,
        )

      // Only 1.4.1 safes with canonical deployment addresses and SafeToL2Setup can be deployed as part of a multichain group
      if (!selectedHasCanonicalSingletonDeployment) return !optionIsSelectedNetwork
      return !optionHasCanonicalSingletonDeployment
    },
    [isAdvancedFlow, selectedNetworks],
  )

  useEffect(() => {
    if (selectedNetworks.length === 1 && selectedNetworks[0].chainId !== currentChain?.chainId) {
      updateCurrentNetwork([selectedNetworks[0]])
    }
  }, [selectedNetworks, currentChain, updateCurrentNetwork])

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field }) => (
        <NetworkMultiSelectorInput
          value={field.value || []}
          name={name}
          onNetworkChange={updateCurrentNetwork}
          isOptionDisabled={isOptionDisabled}
          error={!!errors.networks}
          helperText={errors.networks ? 'Select at least one network' : ''}
        />
      )}
      rules={{ required: true }}
    />
  )
}

export default SafeCreationNetworkInput
