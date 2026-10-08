import classnames from 'classnames'
import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import NextLink, { type LinkProps } from 'next/link'
import { Cloud } from 'lucide-react'
import AddressBookIcon from '@/public/images/sidebar/address-book.svg'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ExplorerButton, { type ExplorerButtonProps } from '@views/components/common/ExplorerButton'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import ImageFallback from '@views/components/common/ImageFallback'
import css from './styles.module.css'

export type SrcEthHashInfoViewProps = {
  address: string
  name?: string | null
  identicon: ReactElement
  customAvatar?: string | null
  avatarSize?: number
  showAvatar: boolean
  onlyName: boolean
  prefix: string
  showPrefix: boolean
  shouldPrefix: boolean
  shortAddress: boolean
  isMobile: boolean
  copyAddress: boolean
  /** Wraps the address in the copy-address container */
  renderCopyableAddress: (address: ReactNode) => ReactNode
  copyButton?: ReactNode
  hasExplorer?: boolean
  ExplorerButtonProps?: ExplorerButtonProps
  addressBookNameSource?: 'space' | 'local'
  highlight4bytes: boolean
  badgeTooltip?: ReactNode
  href?: LinkProps['href']
  boldLabel: boolean
  children?: ReactNode
}

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()

export function SrcEthHashInfoView({
  address,
  name,
  identicon,
  customAvatar,
  avatarSize,
  showAvatar,
  onlyName,
  prefix,
  showPrefix,
  shouldPrefix,
  shortAddress,
  isMobile,
  copyAddress,
  renderCopyableAddress,
  copyButton,
  hasExplorer,
  ExplorerButtonProps,
  addressBookNameSource,
  highlight4bytes,
  badgeTooltip,
  href,
  boldLabel,
  children,
}: SrcEthHashInfoViewProps): ReactElement {
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
          <div
            title={name}
            className={classnames('ethHashInfo-name flex items-center gap-1', { 'font-bold': boldLabel })}
            style={accountStylesWithBadge}
          >
            {href ? (
              <NextLink href={href} className="overflow-hidden text-ellipsis text-inherit hover:underline">
                {name}
              </NextLink>
            ) : (
              <div className="overflow-hidden text-ellipsis">{name}</div>
            )}

            {badgeTooltip
              ? badgeTooltip
              : !!addressBookNameSource && (
                  <Tooltip>
                    <TooltipTrigger render={<span style={{ lineHeight: 0 }} />}>
                      {addressBookNameSource === 'local' ? (
                        <AddressBookIcon className="size-5 text-[var(--color-border-main)]" />
                      ) : (
                        <Cloud className="size-5 text-[var(--color-border-main)]" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      From your {addressBookNameSource === 'space' ? 'Workspace' : 'local'} address book
                    </TooltipContent>
                  </Tooltip>
                )}
          </div>
        ) : (
          badgeTooltip && <div className="flex items-center gap-1">{badgeTooltip}</div>
        )}

        <div className={classnames(css.addressContainer, { [css.inline]: onlyName })}>
          {(!onlyName || !name) && (
            <div
              className={classnames(
                'overflow-hidden text-ellipsis',
                boldLabel && !name ? 'font-bold' : 'font-[weight:inherit]',
                'text-[length:inherit]',
              )}
            >
              {href && !name ? (
                <NextLink href={href} className="text-inherit hover:underline">
                  {addressElement}
                </NextLink>
              ) : copyAddress ? (
                renderCopyableAddress(addressElement)
              ) : (
                addressElement
              )}
            </div>
          )}

          {copyButton}

          {hasExplorer && ExplorerButtonProps && (
            <div className="text-[var(--color-border-main)]">
              <ExplorerButton {...ExplorerButtonProps} onClick={stopPropagation} />
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
