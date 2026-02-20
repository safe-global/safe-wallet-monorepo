import type { ReactNode } from 'react'
import { Typography } from '@mui/material'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { type ContactSource } from '@/hooks/useAllAddressBooks'
import css from '../AccountItems/styles.module.css'

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
      <Typography
        variant="body2"
        component="div"
        className={css.safeAddress}
        sx={monospace ? { fontFamily: 'monospace' } : undefined}
      >
        {chainName ? (
          <Typography
            component="span"
            sx={{
              color: 'var(--color-primary-light)',
              fontSize: 'inherit',
            }}
          >
            {chainName}
          </Typography>
        ) : (
          <NamedAddressInfo
            address={address}
            name={name}
            showName={addressBookNameSource ? !!name : true}
            shortAddress={!fullAddress}
            chainId={chainId}
            showAvatar={false}
            copyAddress={false}
            showPrefix={showPrefix}
            copyPrefix={false}
            addressBookNameSource={addressBookNameSource}
            showCopyButton={showCopyButton}
            hasExplorer={hasExplorer}
            highlight4bytes={highlight4bytes}
          />
        )}
      </Typography>
      {children && <div className={css.accountItemInfoChips}>{children}</div>}
    </div>
  )
}

export default AccountItemInfo
