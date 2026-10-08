import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { OwnerListView } from '@views/components/tx-flow/common/OwnerList/OwnerListView'

export function OwnerList({
  title,
  icon,
  owners,
  className,
  sx,
}: {
  owners: Array<AddressInfo>
  icon?: React.ElementType
  title?: string
  className?: string
  /** @deprecated MUI `sx` is ignored after the shadcn migration; use `className` instead. */
  sx?: object
}): ReactElement {
  void sx
  return (
    <OwnerListView
      title={title}
      icon={icon}
      owners={owners}
      containerClassName={className}
      renderAddress={(props) => <EthHashInfo {...props} />}
    />
  )
}
