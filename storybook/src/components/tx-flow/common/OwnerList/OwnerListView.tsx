import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Fragment, type ElementType, type ReactElement, type ReactNode } from 'react'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'

import PlusIcon from '@/public/images/common/plus.svg'
import { cn } from '@/utils/cn'

import css from './styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type OwnerListViewProps = {
  owners: Array<AddressInfo>
  icon?: ElementType
  title?: string
  containerClassName?: string
  renderAddress: (props: EthHashInfoProps) => ReactNode
}

export function OwnerListView({
  title,
  icon,
  owners,
  containerClassName,
  renderAddress,
}: OwnerListViewProps): ReactElement {
  const Icon = icon ?? PlusIcon
  return (
    <div className={cn(css.container, containerClassName)}>
      <p className="flex items-center text-[length:inherit] text-muted-foreground">
        <Icon className="mr-2 size-4" />
        {title ?? `Add owner${maybePlural(owners)}`}
      </p>
      {owners.map((newOwner) => (
        <Fragment key={newOwner.value}>
          {renderAddress({
            address: newOwner.value,
            name: newOwner.name,
            shortAddress: false,
            showCopyButton: true,
            hasExplorer: true,
            avatarSize: 32,
          })}
        </Fragment>
      ))}
    </div>
  )
}
