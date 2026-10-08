import type { ReactElement, ReactNode } from 'react'
import { isAddress } from 'ethers'
import { type LinkProps } from 'next/link'
import { useIsBelowSm } from '@/hooks/useMediaQuery'
import Identicon from '../../Identicon'
import CopyAddressButton from '../../CopyAddressButton'
import { type ExplorerButtonProps } from '@views/components/common/ExplorerButton'
import type { ContactSource } from '@/hooks/useAllAddressBooks'
import { SrcEthHashInfoView } from '@views/components/common/EthHashInfo/SrcEthHashInfo/SrcEthHashInfoView'

export type EthHashInfoProps = {
  address: string
  chainId?: string
  name?: string | null
  showAvatar?: boolean
  onlyName?: boolean
  showCopyButton?: boolean
  prefix?: string
  showPrefix?: boolean
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
  /** Links the account's label: its name, or the address when unnamed */
  href?: LinkProps['href']
  /** Sets the account's label in bold: its name, or the address when unnamed */
  boldLabel?: boolean
  /** Shows the full address, instead of the copy hint, when hovering the address */
  showAddressTooltip?: boolean
}

const SrcEthHashInfo = ({
  address,
  customAvatar,
  prefix = '',
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
  href,
  boldLabel = false,
  showAddressTooltip = false,
}: EthHashInfoProps): ReactElement => {
  const shouldPrefix = isAddress(address)
  const isMobile = useIsBelowSm()
  const identicon = <Identicon address={address} size={avatarSize} />

  return (
    <SrcEthHashInfoView
      address={address}
      name={name}
      identicon={identicon}
      customAvatar={customAvatar}
      avatarSize={avatarSize}
      showAvatar={showAvatar}
      onlyName={onlyName}
      prefix={prefix}
      showPrefix={showPrefix}
      shouldPrefix={shouldPrefix}
      shortAddress={shortAddress}
      isMobile={isMobile}
      copyAddress={copyAddress}
      renderCopyableAddress={(addressElement) => (
        <CopyAddressButton
          address={address}
          trusted={trusted}
          initialToolTipText={showAddressTooltip ? address : undefined}
        >
          {addressElement}
        </CopyAddressButton>
      )}
      copyButton={showCopyButton && <CopyAddressButton address={address} trusted={trusted} />}
      hasExplorer={hasExplorer}
      ExplorerButtonProps={ExplorerButtonProps}
      addressBookNameSource={addressBookNameSource}
      highlight4bytes={highlight4bytes}
      badgeTooltip={badgeTooltip}
      href={href}
      boldLabel={boldLabel}
    >
      {children}
    </SrcEthHashInfoView>
  )
}

export default SrcEthHashInfo
