import { Box, Button, MenuItem, Select, Typography, Grid, FormControl, InputLabel } from '@mui/material'
import type { ChainInfo, SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { UrlObject } from 'url'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { selectChains } from '@/store/chainsSlice'
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
  chain: ChainInfo
  app: SafeAppData
}

type CompatibleSafesType = { address: string; chainId: string; shortName?: string }

const AppActions = ({ wallet, onConnectWallet, chain, appUrl, app }: Props): React.ReactElement => {
  const lastUsedSafe = useLastSafe()
  const ownedSafes = useOwnedSafes()
  const addressBook = useAppSelector(selectAllAddressBooks)
  const chains = useAppSelector(selectChains)
  const compatibleChains = app.chainIds

  const compatibleSafes = useMemo(
    () => getCompatibleSafes(ownedSafes, compatibleChains, chains.data),
    [ownedSafes, compatibleChains, chains.data],
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
        <Link href={href} passHref legacyBehavior>
          <Button variant="contained" sx={{ width: CTA_BUTTON_WIDTH }} disabled={!safeToUse}>
            Use app
          </Button>
        </Link>
      )
      break
    case shouldCreateSafe:
      const redirect = `${AppRoutes.apps.index}?appUrl=${appUrl}`
      const createSafeHrefWithRedirect: UrlObject = {
        pathname: AppRoutes.newSafe.create,
        query: { safeViewRedirectURL: redirect, chain: chain.shortName },
      }
      button = (
        <Link href={createSafeHrefWithRedirect} passHref legacyBehavior>
          <Button variant="contained" sx={{ width: CTA_BUTTON_WIDTH }}>
            Create new Safe Account
          </Button>
        </Link>
      )
      break
    default:
      button = (
        <Button onClick={onConnectWallet} variant="contained" sx={{ width: CTA_BUTTON_WIDTH }}>
          Connect wallet
        </Button>
      )
  }
  let body: React.ReactNode
  if (hasWallet && hasSafes) {
    body = (
      <FormControl>
        <InputLabel id="safe-select-label">Select a Safe Account</InputLabel>
        <Select
          labelId="safe-select-label"
          value={safeToUse?.address || ''}
          onChange={(e) => {
            const safeToUse = compatibleSafes.find(({ address }) => address === e.target.value)
            setSafeToUse(safeToUse)
          }}
          autoWidth
          label="Select a Safe Account"
          sx={({ spacing }) => ({
            width: '311px',
            minHeight: '56px',
            '.MuiSelect-select': { padding: `${spacing(1)} ${spacing(2)}` },
          })}
        >
          {compatibleSafes.map(({ address, chainId, shortName }) => (
            <MenuItem key={`${chainId}:${address}`} value={address}>
              <Grid
                container
                sx={{
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <SafeIcon address={address} />

                <Grid item xs>
                  <Typography variant="body2">{addressBook?.[chainId]?.[address]}</Typography>

                  <EthHashInfo address={address} showAvatar={false} showName={false} prefix={shortName} />
                </Grid>
              </Grid>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  } else {
    body = <CreateNewSafeSVG alt="An icon of a physical safe with a plus sign" />
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontWeight: 700,
        height: CTA_HEIGHT,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
        }}
      >
        Use the App with your Safe Account
      </Typography>
      {body}
      {button}
    </Box>
  )
}

export { AppActions }

const getCompatibleSafes = (
  ownedSafes: { [chainId: string]: string[] },
  compatibleChains: string[],
  chainsData: ChainInfo[],
): CompatibleSafesType[] => {
  return compatibleChains.reduce<CompatibleSafesType[]>((safes, chainId) => {
    const chainData = chainsData.find((chain: ChainInfo) => chain.chainId === chainId)

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
