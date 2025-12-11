import classnames from 'classnames'
import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { isAddress } from 'ethers'
import { useTheme } from '@mui/material/styles'
import { Box, SvgIcon, Tooltip } from '@mui/material'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import useMediaQuery from '@mui/material/useMediaQuery'
import Identicon from '../../Identicon'
import CopyAddressButton from '../../CopyAddressButton'
import ExplorerButton, { type ExplorerButtonProps } from '../../ExplorerButton'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import ImageFallback from '../../ImageFallback'
import css from './styles.module.css'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import { ShieldIconHypernativeTooltip } from '@/features/hypernative/components/ShieldIconHypernativeTooltip'

export type EthHashInfoProps = {
  address: string
  chainId?: string
  name?: string | null
  showAvatar?: boolean
  onlyName?: boolean
  showCopyButton?: boolean
  prefix?: string
  showPrefix?: boolean
  copyPrefix?: boolean
  shortAddress?: boolean
  copyAddress?: boolean
  customAvatar?: string | null
  hasExplorer?: boolean
  avatarSize?: number
  children?: ReactNode
  trusted?: boolean
  ExplorerButtonProps?: ExplorerButtonProps
  addressBookNameSource?: ContactSource
  highlight4bytes?: boolean
  showShieldIcon?: boolean
}

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()

const SrcEthHashInfo = ({
  address,
  customAvatar,
  prefix = '',
  copyPrefix = true,
  showPrefix = true,
  shortAddress = true,
  copyAddress = true,
  showAvatar = true,
  onlyName = false,
  avatarSize,
  name,
  showCopyButton,
  hasExplorer,
  ExplorerButtonProps,
  children,
  trusted = true,
  addressBookNameSource,
  highlight4bytes = false,
  showShieldIcon = false,
}: EthHashInfoProps): ReactElement => {
  const shouldPrefix = isAddress(address)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const identicon = <Identicon address={address} size={avatarSize} />
  const shouldCopyPrefix = shouldPrefix && copyPrefix

  const highlightedAddress = highlight4bytes ? (
    <>
      {address.slice(0, 2)}
      <b>{address.slice(2, 6)}</b>
      {address.slice(6, -4)}
      <b>{address.slice(-4)}</b>
    </>
  ) : (
    address
  )

  const addressElement = (
    <>
      {showPrefix && shouldPrefix && prefix && <b>{prefix}:</b>}
      <span>{shortAddress || isMobile ? shortenAddress(address) : highlightedAddress}</span>
    </>
  )

  const safeShieldSvgStyles = {
    fontSize: 'medium',
    '& .shield-img': {
      fill: 'var(--color-text-brand)',
      transition: 'fill 0.2s ease',
    },
    '& .shield-lines': {
      fill: '#121312 !important', // consistent between dark/light modes
      stroke: '#121312 !important',
      transition: 'fill 0.2s ease',
    },
  }

  const accountStylesWithShieldEnabled = {
    backgroundColor: 'var(--color-background-main)',
    fontWeight: 'bold',
    borderRadius: '16px',
    padding: name ? '2px 8px 2px 6px' : undefined,
    width: 'fit-content',
  }

  return (
    <div className={css.container}>
      {showAvatar && (
        <div
          className={css.avatarContainer}
          style={avatarSize !== undefined ? { width: `${avatarSize}px`, height: `${avatarSize}px` } : undefined}
        >
          {customAvatar ? (
            <ImageFallback src={customAvatar} fallbackComponent={identicon} width={avatarSize} height={avatarSize} />
          ) : (
            identicon
          )}
        </div>
      )}

      <Box overflow="hidden" className={onlyName ? css.inline : undefined} gap={0.5}>
        {name && (
          <Box
            title={name}
            className="ethHashInfo-name"
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={showShieldIcon ? accountStylesWithShieldEnabled : undefined}
          >
            <Box overflow="hidden" textOverflow="ellipsis">
              {name}
            </Box>

            {showShieldIcon ? (
              <ShieldIconHypernativeTooltip iconStyles={safeShieldSvgStyles} />
            ) : (
              !!addressBookNameSource && (
                <Tooltip title={`From your ${addressBookNameSource} address book`} placement="top">
                  <span style={{ lineHeight: 0 }}>
                    <SvgIcon
                      component={addressBookNameSource === ContactSource.local ? AddressBookIcon : CloudOutlinedIcon}
                      inheritViewBox
                      color="border"
                      fontSize="small"
                    />
                  </span>
                </Tooltip>
              )
            )}
          </Box>
        )}

        {/* Show shield icon even when there's no name */}
        {!name && showShieldIcon && (
          <Box display="flex" alignItems="center" gap={0.5} sx={accountStylesWithShieldEnabled}>
            <ShieldIconHypernativeTooltip iconStyles={safeShieldSvgStyles} />
          </Box>
        )}

        <div className={classnames(css.addressContainer, { [css.inline]: onlyName })}>
          {(!onlyName || !name) && (
            <Box fontWeight="inherit" fontSize="inherit" overflow="hidden" textOverflow="ellipsis">
              {copyAddress ? (
                <CopyAddressButton prefix={prefix} address={address} copyPrefix={shouldCopyPrefix} trusted={trusted}>
                  {addressElement}
                </CopyAddressButton>
              ) : (
                addressElement
              )}
            </Box>
          )}

          {showCopyButton && (
            <CopyAddressButton prefix={prefix} address={address} copyPrefix={shouldCopyPrefix} trusted={trusted} />
          )}

          {hasExplorer && ExplorerButtonProps && (
            <Box color="border.main">
              <ExplorerButton {...ExplorerButtonProps} onClick={stopPropagation} />
            </Box>
          )}

          {children}
        </div>
      </Box>
    </div>
  )
}

export default SrcEthHashInfo
