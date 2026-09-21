import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
import { CTA_BUTTON_WIDTH, CTA_HEIGHT } from '@/components/safe-apps/SafeAppLandingPage/constants'
import CreateNewSafeSVG from '@/public/images/open/safe-creation.svg'

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

  let button: React.ReactNode
  switch (true) {
    case hasWallet && hasSafes && !!safeToUse:
      const safe = `${safeToUse?.shortName}:${safeToUse?.address}`
      const href: UrlObject = {
        pathname: AppRoutes.apps.open,
        query: { safe, appUrl },
      }

      button = (
        <Button style={{ width: CTA_BUTTON_WIDTH }} disabled={!safeToUse} render={<Link href={href} />}>
          Use app
        </Button>
      )
      break
    case shouldCreateSafe:
      const redirect = `${AppRoutes.apps.index}?appUrl=${appUrl}`
      const createSafeHrefWithRedirect: UrlObject = {
        pathname: AppRoutes.newSafe.create,
        query: { safeViewRedirectURL: redirect, chain: chain.shortName },
      }
      button = (
        <Button style={{ width: CTA_BUTTON_WIDTH }} render={<Link href={createSafeHrefWithRedirect} />}>
          Create new Safe account
        </Button>
      )
      break
    default:
      button = (
        <Button onClick={onConnectWallet} style={{ width: CTA_BUTTON_WIDTH }}>
          Connect wallet
        </Button>
      )
  }
  let body: React.ReactNode
  if (hasWallet && hasSafes) {
    body = (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="safe-select-label">Select a Safe account</Label>
        <Select
          value={safeToUse?.address || ''}
          onValueChange={(value) => {
            const safeToUse = compatibleSafes.find(({ address }) => address === value)
            setSafeToUse(safeToUse)
          }}
        >
          <SelectTrigger id="safe-select-label" className="min-h-[56px] w-[311px]">
            <SelectValue placeholder="Select a Safe account" />
          </SelectTrigger>
          <SelectContent>
            {compatibleSafes.map(({ address, chainId, shortName }) => (
              <SelectItem key={`${chainId}:${address}`} value={address}>
                <div className="flex items-center gap-2">
                  <SafeIcon address={address} />

                  <div className="flex-1">
                    <Typography variant="paragraph-small">{addressBook?.[chainId]?.[address]}</Typography>

                    <EthHashInfo address={address} showAvatar={false} showName={false} prefix={shortName} />
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  } else {
    body = <CreateNewSafeSVG alt="An icon of a physical safe with a plus sign" />
  }

  return (
    <div className="flex flex-col items-center justify-between font-bold" style={{ height: CTA_HEIGHT }}>
      <Typography variant="paragraph-bold">Use the App with your Safe account</Typography>
      {body}
      {button}
    </div>
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
