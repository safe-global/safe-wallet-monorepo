import classnames from 'classnames'
import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { isAddress } from 'ethers'
import { Cloud } from 'lucide-react'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import { useIsMobile } from '@/hooks/use-mobile'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
}: EthHashInfoProps): ReactElement => {
  const shouldPrefix = isAddress(address)
  const isMobile = useIsMobile()
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

  const addressElement = (
    <>
      {showPrefix && shouldPrefix && prefix && <b>{prefix}:</b>}
      <span>{shortAddress || isMobile ? shortenAddress(address) : highlightedAddress}</span>
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

      <div className={classnames('gap-1 overflow-hidden', { [css.inline]: onlyName })}>
        {!!name ? (
          <div title={name} className="ethHashInfo-name flex items-center gap-1" style={accountStylesWithBadge}>
            <div className="overflow-hidden text-ellipsis">{name}</div>

            {badgeTooltip
              ? badgeTooltip
              : !!addressBookNameSource && (
                  <Tooltip>
                    <TooltipTrigger render={<span style={{ lineHeight: 0 }} />}>
                      {addressBookNameSource === ContactSource.local ? (
                        <AddressBookIcon className="size-5 text-border" />
                      ) : (
                        <Cloud className="size-5 text-border" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      From your {addressBookNameSource === ContactSource.space ? 'workspace' : 'local'} address book
                    </TooltipContent>
                  </Tooltip>
                )}
          </div>
        ) : (
          badgeTooltip && <div className="flex items-center gap-1">{badgeTooltip}</div>
        )}

        <div className={classnames(css.addressContainer, { [css.inline]: onlyName })}>
          {(!onlyName || !name) && (
            <div className="overflow-hidden text-ellipsis font-[weight:inherit] text-[length:inherit]">
              {copyAddress ? (
                <CopyAddressButton prefix={prefix} address={address} copyPrefix={shouldCopyPrefix} trusted={trusted}>
                  {addressElement}
                </CopyAddressButton>
              ) : (
                addressElement
              )}
            </div>
          )}

          {showCopyButton && (
            <CopyAddressButton prefix={prefix} address={address} copyPrefix={shouldCopyPrefix} trusted={trusted} />
          )}

          {hasExplorer && ExplorerButtonProps && (
            <div className="text-border">
              <ExplorerButton {...ExplorerButtonProps} onClick={stopPropagation} />
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}

export default SrcEthHashInfo
