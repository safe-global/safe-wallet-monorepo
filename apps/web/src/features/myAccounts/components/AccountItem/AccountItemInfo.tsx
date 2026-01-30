import type { ReactNode } from 'react'
import { Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import { type ContactSource } from '@/hooks/useAllAddressBooks'
import css from '../AccountItems/styles.module.css'

export interface AccountItemInfoProps {
  address: string
  chainId: string
  name?: string
  chainName?: string // For multi-chain items, show chain name instead of address
  children?: ReactNode // For chips or other content below the address
  showPrefix?: boolean
  addressBookNameSource?: ContactSource
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
  addressBookNameSource,
}: AccountItemInfoProps) {
  return (
    <div className={css.accountItemInfo}>
      <Typography variant="body2" component="div" className={css.safeAddress}>
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
          <EthHashInfo
            address={address}
            name={name}
            showName={addressBookNameSource ? !!name : true}
            shortAddress
            chainId={chainId}
            showAvatar={false}
            copyAddress={false}
            showPrefix={showPrefix}
            copyPrefix={false}
            addressBookNameSource={addressBookNameSource}
          />
        )}
      </Typography>
      {children && <div className={css.accountItemInfoChips}>{children}</div>}
    </div>
  )
}

export default AccountItemInfo
