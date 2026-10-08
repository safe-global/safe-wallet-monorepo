import type { ReactElement } from 'react'

import InfoIcon from '@/public/images/notifications/info.svg'

import addressBookInputCss from '@/components/common/AddressBookInput/styles.module.css'

export function RecovererSmartContractWarningView(): ReactElement {
  return (
    <p
      className={`${addressBookInputCss.unknownAddress} text-sm !bg-[var(--color-warning-background)] !text-[var(--color-warning-main)]`}
    >
      <InfoIcon className="size-4" />
      {'The given address is a smart contract. Please ensure that it can sign transactions.'}
    </p>
  )
}
