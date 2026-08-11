import { type ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import css from './styles.module.css'

const AddressInputReadOnly = ({
  address,
  showPrefix,
  chainId,
}: {
  address: string
  showPrefix?: boolean
  chainId?: string
}): ReactElement => {
  return (
    <div className={css.input} data-testid="address-book-recipient">
      <div className="flex h-full items-center">
        <div className="w-full text-sm">
          <EthHashInfo
            address={address}
            shortAddress={false}
            copyAddress={false}
            chainId={chainId}
            showPrefix={showPrefix}
            avatarSize={32}
          />
        </div>
      </div>
    </div>
  )
}

export default AddressInputReadOnly
