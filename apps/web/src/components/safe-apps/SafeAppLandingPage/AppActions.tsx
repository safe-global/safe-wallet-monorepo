import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useEffect, useMemo, useState } from 'react'
import type { UrlObject } from 'url'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import useChains from '@/hooks/useChains'
import useLastSafe from '@/hooks/useLastSafe'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import SafeIcon from '@/components/common/SafeIcon'
import EthHashInfo from '@/components/common/EthHashInfo'
import { AppRoutes } from '@/config/routes'
import useOwnedSafes from '@/hooks/useOwnedSafes'
import { AppActionsView, type AppActionsViewProps } from '@views/components/safe-apps/SafeAppLandingPage/AppActionsView'

type Props = {
  appUrl: string
  wallet: ConnectedWallet | null
  onConnectWallet: () => Promise<void>
  chain: Chain
  app: SafeAppData
}

type CompatibleSafesType = { address: string; chainId: string; shortName?: string }

const AppActions = ({ wallet, onConnectWallet, chain, appUrl, app }: Props): React.ReactElement => {
  const lastUsedSafe = useLastSafe()
  const ownedSafes = useOwnedSafes()
  const addressBook = useAppSelector(selectAllAddressBooks)
  const { configs: chains } = useChains()
  const compatibleChains = app.chainIds

  const compatibleSafes = useMemo(
    () => getCompatibleSafes(ownedSafes, compatibleChains, chains),
    [ownedSafes, compatibleChains, chains],
  )

  const [safeToUse, setSafeToUse] = useState<CompatibleSafesType>()

  useEffect(() => {
    const defaultSafe = getDefaultSafe(compatibleSafes, chain.chainId, lastUsedSafe)
    if (defaultSafe) {
      setSafeToUse(defaultSafe)
    }
  }, [compatibleSafes, chain.chainId, lastUsedSafe])

  const hasWallet = !!wallet
  const hasSafes = compatibleSafes.length > 0
  const shouldCreateSafe = hasWallet && !hasSafes

  let cta: AppActionsViewProps['cta']
  let useAppHref: UrlObject | undefined
  let createSafeHref: UrlObject | undefined
  switch (true) {
    case hasWallet && hasSafes && !!safeToUse:
      const safe = `${safeToUse?.shortName}:${safeToUse?.address}`
      useAppHref = {
        pathname: AppRoutes.apps.open,
        // eslint-disable-next-line no-restricted-syntax -- The shared Safe App page picks one of the user's Safes and has no Workspace
        query: { safe, appUrl },
      }
      cta = 'use'
      break
    case shouldCreateSafe:
      const redirect = `${AppRoutes.apps.index}?appUrl=${appUrl}`
      createSafeHref = {
        pathname: AppRoutes.newSafe.create,
        query: { safeViewRedirectURL: redirect, chain: chain.shortName },
      }
      cta = 'create'
      break
    default:
      cta = 'connect'
  }

  return (
    <AppActionsView
      cta={cta}
      useAppHref={useAppHref}
      createSafeHref={createSafeHref}
      isUseAppDisabled={!safeToUse}
      onConnectWallet={onConnectWallet}
      showSafeSelect={hasWallet && hasSafes}
      selectedSafeAddress={safeToUse?.address || ''}
      compatibleSafes={compatibleSafes.map((safe) => ({ ...safe, name: addressBook?.[safe.chainId]?.[safe.address] }))}
      onSelectSafe={(value) => {
        const safeToUse = compatibleSafes.find(({ address }) => address === value)
        setSafeToUse(safeToUse)
      }}
      renderSafeIcon={(address) => <SafeIcon address={address} />}
      renderAddress={({ address, prefix }) => (
        <EthHashInfo address={address} showAvatar={false} showName={false} prefix={prefix} />
      )}
    />
  )
}

export { AppActions }

const getCompatibleSafes = (
  ownedSafes: { [chainId: string]: string[] },
  compatibleChains: string[],
  chainsData: Chain[],
): CompatibleSafesType[] => {
  return compatibleChains.reduce<CompatibleSafesType[]>((safes, chainId) => {
    const chainData = chainsData.find((chain: Chain) => chain.chainId === chainId)

    return [
      ...safes,
      ...(ownedSafes[chainId] || []).map((address) => ({
        address,
        chainId,
        shortName: chainData?.shortName,
      })),
    ]
  }, [])
}

const getDefaultSafe = (
  compatibleSafes: CompatibleSafesType[],
  chainId: string,
  lastUsedSafe = '',
): CompatibleSafesType => {
  // as a first option, we use the last used Safe in the provided chain
  const lastViewedSafe = compatibleSafes.find((safe) => safe.address === parsePrefixedAddress(lastUsedSafe).address)

  if (lastViewedSafe) {
    return lastViewedSafe
  }

  // as a second option, we use any user Safe in the provided chain
  const safeInTheSameChain = compatibleSafes.find((safe) => safe.chainId === chainId)

  if (safeInTheSameChain) {
    return safeInTheSameChain
  }

  // as a fallback we salect a random compatible user Safe
  return compatibleSafes[0]
}
