import type { ReactNode } from 'react'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { type ContactSource } from '@/hooks/useAllAddressBooks'
import css from '../AccountItems/styles.module.css'
import { cn } from '@/utils/cn'

export interface AccountItemInfoProps {
  address: string
  chainId: string
  name?: string
  chainName?: string // For multi-chain items, show chain name instead of address
  children?: ReactNode // For chips or other content below the address
  showPrefix?: boolean
  fullAddress?: boolean // Show full address instead of truncated
  addressBookNameSource?: ContactSource
  showCopyButton?: boolean // Show copy button next to address
  hasExplorer?: boolean // Show explorer link next to address
  highlight4bytes?: boolean // Highlight first 4 and last 4 chars (for similar addresses)
  monospace?: boolean // Use monospace font for address (easier to compare)
  'data-testid'?: string
}

/**
 * Displays Safe address/name info. Accepts children (like AccountItem.Chips)
 * to render below the address for proper vertical centering.
 */
function AccountItemInfo({
  address,
  chainId,
  name,
  chainName,
  children,
  showPrefix = true,
  fullAddress = false,
  addressBookNameSource,
  showCopyButton = false,
  hasExplorer = false,
  monospace = false,
  highlight4bytes = false,
  'data-testid': testId,
}: AccountItemInfoProps) {
  return (
    <div className={css.accountItemInfo} data-testid={testId}>
      <div className={cn(css.safeAddress, 'text-sm leading-5', monospace && 'font-mono')}>
        {chainName ? (
          <span className="text-muted-foreground text-[length:inherit]">{chainName}</span>
        ) : (
          <NamedAddressInfo
            address={address}
            name={name}
            noContractName
            showName={addressBookNameSource ? !!name : true}
            shortAddress={!fullAddress}
            chainId={chainId}
            showAvatar={false}
            copyAddress={false}
            showPrefix={showPrefix}
            addressBookNameSource={addressBookNameSource}
            showCopyButton={showCopyButton}
            hasExplorer={hasExplorer}
            highlight4bytes={highlight4bytes}
          />
        )}
      </div>
      {children && <div className={css.accountItemInfoChips}>{children}</div>}
    </div>
  )
}

export default AccountItemInfo
