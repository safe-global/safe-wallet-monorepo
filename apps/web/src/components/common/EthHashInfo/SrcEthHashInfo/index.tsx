import classnames from 'classnames'
import type { CSSProperties, ReactElement, ReactNode, SyntheticEvent } from 'react'
import { isAddress } from 'ethers'
import { useTheme } from '@mui/material/styles'
import { Box, Tooltip } from '@mui/material'
import { Building2, HardDrive } from 'lucide-react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import Identicon from '../../Identicon'
import CopyAddressButton from '../../CopyAddressButton'
import ExplorerButton, { type ExplorerButtonProps } from '../../ExplorerButton'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import ImageFallback from '../../ImageFallback'
import css from './styles.module.css'
import { ContactSource } from '@/hooks/useAllAddressBooks'

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
  badgeTooltip?: ReactNode
  /** Address-poisoning Mode B: highlight the matching end characters in the tone of the match. */
  similarity?: SimilarityMatch | null
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
  badgeTooltip,
  similarity,
}: EthHashInfoProps): ReactElement => {
  const shouldPrefix = isAddress(address)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const showShort = shortAddress || isMobile
  const identicon = <Identicon address={address} size={avatarSize} />
  const shouldCopyPrefix = shouldPrefix && copyPrefix

  const accountStylesWithBadge = badgeTooltip
    ? {
        backgroundColor: 'var(--color-background-main)',
        fontWeight: 'bold',
        borderRadius: '16px',
        padding: name ? '2px 8px 2px 6px' : undefined,
      }
    : undefined

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

  // Mode B: colour exactly the matching end characters — the real shared prefix/suffix lengths,
  // not a fixed 4 — so a look-alike can't hide in a list at a glance. Each end is highlighted only
  // when its match reaches the 4-char threshold; lengths are clamped so the two ranges never overlap.
  const similarityAddress = (): ReactNode => {
    const isCritical = similarity?.severity === Severity.CRITICAL
    const hlStyle: CSSProperties = {
      backgroundColor: isCritical ? 'var(--color-error-background)' : 'var(--color-warning-background)',
      color: isCritical ? 'var(--color-error-dark)' : 'var(--color-warning-dark)',
      borderRadius: '2px',
      padding: '0 1px',
      fontWeight: 700,
    }
    const hexLen = address.length - 2
    const frontLen = Math.min((similarity?.prefixLen ?? 0) >= 4 ? (similarity?.prefixLen ?? 0) : 0, hexLen)
    const backLen = Math.min((similarity?.suffixLen ?? 0) >= 4 ? (similarity?.suffixLen ?? 0) : 0, hexLen - frontLen)
    const frontEnd = 2 + frontLen
    const backStart = address.length - backLen
    return (
      <>
        {address.slice(0, 2)}
        {frontLen > 0 && <b style={hlStyle}>{address.slice(2, frontEnd)}</b>}
        {/* Collapse the middle only when the caller explicitly asked for a short address — NOT merely on
            mobile — so a look-alike shown for comparison always renders its full middle. */}
        {shortAddress ? '…' : address.slice(frontEnd, backStart)}
        {backLen > 0 && <b style={hlStyle}>{address.slice(backStart)}</b>}
      </>
    )
  }

  const addressBody = similarity ? similarityAddress() : showShort ? shortenAddress(address) : highlightedAddress

  const addressElement = (
    <>
      {showPrefix && shouldPrefix && prefix && <b>{prefix}:</b>}
      <span>{addressBody}</span>
    </>
  )

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
        {!!name ? (
          <Box
            title={name}
            className="ethHashInfo-name"
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={accountStylesWithBadge}
          >
            <Box overflow="hidden" textOverflow="ellipsis">
              {name}
            </Box>

            {badgeTooltip
              ? badgeTooltip
              : !!addressBookNameSource && (
                  <Tooltip
                    title={`From your ${addressBookNameSource === ContactSource.space ? 'workspace' : 'local'} address book`}
                    placement="top"
                  >
                    <span style={{ lineHeight: 0, color: 'var(--color-border-main)' }}>
                      {addressBookNameSource === ContactSource.local ? (
                        <HardDrive size={16} />
                      ) : (
                        <Building2 size={16} />
                      )}
                    </span>
                  </Tooltip>
                )}
          </Box>
        ) : (
          badgeTooltip && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {badgeTooltip}
            </Box>
          )
        )}

        <div className={classnames(css.addressContainer, { [css.inline]: onlyName })}>
          {(!onlyName || !name) && (
            <Box
              fontWeight="inherit"
              fontSize="inherit"
              // A similarity row must show every character for comparison — wrap the full address instead
              // of clipping it with an ellipsis.
              overflow={similarity ? 'visible' : 'hidden'}
              textOverflow={similarity ? 'clip' : 'ellipsis'}
              sx={similarity ? { whiteSpace: 'normal', wordBreak: 'break-all' } : undefined}
            >
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
