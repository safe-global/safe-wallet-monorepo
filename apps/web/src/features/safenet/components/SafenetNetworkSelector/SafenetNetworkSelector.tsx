import NetworkLogosList from '@/features/multichain/components/NetworkLogosList'
import useChains from '@/hooks/useChains'
import { useDarkMode } from '@/hooks/useDarkMode'
import { default as CaretDownIcon, default as CaretUpIcon } from '@/public/images/common/caret-down.svg'
import SafenetDarkLogo from '@/public/images/safenet/logo-safenet-dark-gradient.svg'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { Box, SvgIcon, Typography } from '@mui/material'
import { useState } from 'react'
import css from './styles.module.css'

type SafenetNetworkSelectorProps = {
  expandable?: boolean
  displayLogo?: boolean
}

function SafenetNetworkSelector({ expandable = false, displayLogo = true }: SafenetNetworkSelectorProps) {
  const isDarkMode = useDarkMode()
  const { data } = useGetSafenetConfigQuery()
  const { configs } = useChains()
  const [open, setOpen] = useState<boolean>(false)

  const chains = data?.chains.map((chain) => chain.toString())
  const safenetChains = configs.filter((chain) => chains?.includes(chain.chainId))

  const handleOpen = () => {
    if (!expandable) return
    setOpen(!open)
  }

  return (
    <Box className={css.content}>
      <Box
        className={!open ? css.chip : css.openChip}
        onClick={handleOpen}
        sx={{ cursor: expandable ? 'pointer' : 'inherit' }}
      >
        {!displayLogo && (
          <Typography variant="caption" sx={{ marginLeft: '6px' }}>
            SUPPORTED NETWORKS:
          </Typography>
        )}
        <Box className={css.multiChains}>
          <NetworkLogosList networks={safenetChains} showHasMore />
        </Box>
        {displayLogo && (isDarkMode ? <SafenetLogo className={css.logo} /> : <SafenetDarkLogo className={css.logo} />)}
        {expandable && (
          <SvgIcon
            component={open ? CaretUpIcon : CaretDownIcon}
            inheritViewBox
            fontSize="small"
            sx={{ marginRight: '6px' }}
          />
        )}
      </Box>
      {expandable && open && safenetChains && (
        <Box className={css.list}>
          {safenetChains.map((chain) => (
            <Box className={css.networkItem} key={`safenet_${chain.chainId}`}>
              <img
                src={chain?.chainLogoUri ?? undefined}
                alt={`${chain?.chainName} Logo`}
                width={24}
                height={24}
                loading="lazy"
              />
              <Typography>{chain.chainName}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default SafenetNetworkSelector
