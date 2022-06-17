import { Fragment, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useTheme } from '@mui/material/styles'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import type { SafeInfo } from '@gnosis.pm/safe-react-gateway-sdk'

import useChains from '@/services/useChains'
import useOwnedSafes from '@/services/useOwnedSafes'
import useChainId from '@/services/useChainId'
import { useAppSelector } from '@/store'
import { AddedSafesState, selectAllAddedSafes } from '@/store/addedSafesSlice'
import useSafeAddress from '@/services/useSafeAddress'
import SafeListItem from '@/components/sidebar/SafeListItem'

import css from './styles.module.css'

const getSafesOnChain = ({
  chainId,
  ownedSafes,
  addedSafes,
}: {
  chainId: string
  ownedSafes: ReturnType<typeof useOwnedSafes>
  addedSafes: AddedSafesState
}): {
  ownedSafesOnChain: string[]
  localSafesOnChain: SafeInfo[]
} => {
  const ownedSafesOnChain = ownedSafes[chainId] ?? []

  const addedSafesOnChain = addedSafes[chainId] ?? {}
  const localSafesOnChain = Object.values(addedSafesOnChain)

  return { ownedSafesOnChain, localSafesOnChain }
}

const shouldExpandSafeList = ({
  isCurrentChain,
  safeAddress,
  ownedSafesOnChain,
  localSafesOnChain,
}: {
  isCurrentChain: boolean
  safeAddress: string
  ownedSafesOnChain: string[]
  localSafesOnChain: SafeInfo[]
}) => {
  let shouldExpand = false

  if (isCurrentChain && ownedSafesOnChain.some((address) => address.toLowerCase() === safeAddress.toLowerCase())) {
    // Expand the Owned Safes if the current Safe is owned, but not added
    shouldExpand = !localSafesOnChain.some(({ address }) => address.value.toLowerCase() === safeAddress.toLowerCase())
  } else {
    // Expand the Owned Safes if there are no added Safes
    shouldExpand = !localSafesOnChain.length && localSafesOnChain.length <= MAX_EXPANDED_SAFES
  }

  return shouldExpand
}

const MAX_EXPANDED_SAFES = 3

const SafeList = ({ closeDrawer }: { closeDrawer: () => void }): ReactElement => {
  const router = useRouter()
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const { configs } = useChains()
  const ownedSafes = useOwnedSafes()
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const { palette } = useTheme()

  const [open, setOpen] = useState<Record<string, boolean>>({})
  const toggleOpen = (chainId: string) => {
    setOpen((prev) => ({ [chainId]: !prev[chainId] }))
  }

  return (
    <List className={css.list}>
      <ListItem>
        <ListItemIcon>
          <IconButton>
            <AddCircleOutlinedIcon sx={({ palette }) => ({ fill: palette.primary.main })} />
          </IconButton>
        </ListItemIcon>
        <ListItemText>Add Safe</ListItemText>
      </ListItem>
      {configs.map((chain) => {
        const { ownedSafesOnChain, localSafesOnChain } = getSafesOnChain({
          chainId: chain.chainId,
          ownedSafes,
          addedSafes,
        })

        const isCurrentChain = chain.chainId === chainId

        if (!isCurrentChain && !ownedSafesOnChain.length && !localSafesOnChain.length) {
          return null
        }

        let initialExpand = shouldExpandSafeList({
          isCurrentChain,
          safeAddress,
          ownedSafesOnChain,
          localSafesOnChain,
        })

        const isOpen = open[chain.chainId]
        return (
          <Fragment key={chain.chainName}>
            <ListItem selected sx={{ py: 0 }}>
              <Box
                component="span"
                className={css.dot}
                sx={{ color: chain.theme.textColor, backgroundColor: chain.theme.backgroundColor }}
              />{' '}
              <ListItemText primaryTypographyProps={{ variant: 'subtitle2', color: palette.black[400] }}>
                {chain.chainName}
              </ListItemText>
            </ListItem>

            {!localSafesOnChain.length && !ownedSafesOnChain.length && (
              <Typography paddingY="22px" variant="subtitle2" sx={({ palette }) => ({ color: palette.black[400] })}>
                <Link href={{ href: '/welcome', query: router.query }} passHref>
                  Create or add
                </Link>{' '}
                an existing Safe on this network
              </Typography>
            )}

            {localSafesOnChain.map(({ address, threshold, owners }) => (
              <SafeListItem
                key={address.value}
                address={address.value}
                threshold={threshold}
                owners={owners.length}
                chainId={chain.chainId}
                closeDrawer={closeDrawer}
              />
            ))}

            {ownedSafesOnChain.length > 0 && (
              <>
                <ListItemButton
                  onClick={() => {
                    initialExpand = false
                    toggleOpen(chainId)
                  }}
                  sx={{ '&:hover': { backgroundColor: 'unset' } }}
                  disableRipple
                >
                  <ListItemText
                    primaryTypographyProps={{ variant: 'subtitle2', color: palette.black[400], marginLeft: '40px' }}
                  >
                    Safes owned on {chain.chainName} ({ownedSafesOnChain.length})
                  </ListItemText>
                  {isOpen ? (
                    <ExpandLess sx={({ palette }) => ({ fill: palette.black[400] })} />
                  ) : (
                    <ExpandMore sx={({ palette }) => ({ fill: palette.black[400] })} />
                  )}
                </ListItemButton>
                <Collapse key={chainId} in={initialExpand || isOpen}>
                  <List>
                    {ownedSafesOnChain.map((address) => (
                      <SafeListItem key={address} address={address} chainId={chainId} closeDrawer={closeDrawer} />
                    ))}
                  </List>
                </Collapse>
              </>
            )}
          </Fragment>
        )
      })}
    </List>
  )
}

export default SafeList
