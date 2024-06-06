import type { ReactNode, ReactElement, SyntheticEvent } from 'react'
import { isAddress } from 'ethers'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import Identicon from '../../Identicon'
import CopyAddressButton from '../../CopyAddressButton'
import ExplorerButton, { type ExplorerButtonProps } from '../../ExplorerButton'
import { shortenAddress } from '@/utils/formatters'
import ImageFallback from '../../ImageFallback'
import css from './styles.module.css'
import classNames from 'classnames'
import { IconButton, SvgIcon, Typography } from '@mui/material'
import Close from '@/public/images/common/close-rounded.svg'

export type EthHashInfoProps = {
  address: string
  chainId?: string
  name?: string | null
  showAvatar?: boolean
  showCopyButton?: boolean
  prefix?: string
  showPrefix?: boolean
  copyPrefix?: boolean
  shortAddress?: boolean
  copyAddress?: boolean
  customAvatar?: string
  hasExplorer?: boolean
  avatarSize?: number
  children?: ReactNode
  trusted?: boolean
  ExplorerButtonProps?: ExplorerButtonProps
  shortAddressSize?: number
}

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()

const SrcEthHashInfo = ({
  address,
  customAvatar,
  prefix = '',
  isPopulated = false,
  copyPrefix = true,
  showPrefix = true,
  shortAddress = true,
  copyAddress = true,
  showAvatar = true,
  avatarSize,
  name,
  showCopyButton,
  hasExplorer,
  ExplorerButtonProps,
  children,
  trusted = true,
  shortAddressSize,
}: EthHashInfoProps & { isPopulated?: boolean }): ReactElement => {
  const shouldPrefix = isAddress(address)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const identicon = <Identicon address={address} size={avatarSize} />
  const shouldCopyPrefix = shouldPrefix && copyPrefix

  const addressElement = (
    <>
      {showPrefix && shouldPrefix && prefix && <b>{prefix}:</b>}
      <span>{shortAddress || isMobile ? shortenAddress(address, shortAddressSize ?? 4) : address}</span>
    </>
  )

  return (
    <div className={css.container}>
      {showAvatar && (
        <div
          className={classNames([css.avatarContainer, isPopulated && css.disabled])}
          style={avatarSize !== undefined ? { width: `${avatarSize}px`, height: `${avatarSize}px` } : undefined}
        >
          {customAvatar ? (
            <ImageFallback src={customAvatar} fallbackComponent={identicon} width={avatarSize} height={avatarSize} />
          ) : (
            identicon
          )}
        </div>
      )}

      <Box overflow="hidden">
        {name && (
          <Box textOverflow="ellipsis" overflow="hidden" title={name}>
            {name}
          </Box>
        )}

        <div className={css.addressContainer}>
          <Box fontWeight="inherit" fontSize="inherit" overflow="hidden" textOverflow="ellipsis">
            {copyAddress ? (
              <CopyAddressButton prefix={prefix} address={address} copyPrefix={shouldCopyPrefix} trusted={trusted}>
                {addressElement}
              </CopyAddressButton>
            ) : (
              addressElement
            )}
          </Box>

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
