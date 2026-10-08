import type { ElementType, ReactElement, ReactNode } from 'react'
import MinusIcon from '@/public/images/common/minus.svg'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import FieldsGrid from '@views/components/tx/FieldsGrid'

type Owner = { value: string; name?: string }

export type OwnerListRenderProps = {
  owners: Owner[]
  title?: string
  icon?: ElementType
  className?: string
}

export type ManageSignersActionsViewProps = {
  addedOwners: Owner[]
  removedOwners: Owner[]
  renderOwnerList: (props: OwnerListRenderProps) => ReactNode
}

export function ManageSignersActionsView({
  addedOwners,
  removedOwners,
  renderOwnerList,
}: ManageSignersActionsViewProps): ReactElement {
  return (
    <FieldsGrid title="Actions">
      {removedOwners.length > 0 &&
        renderOwnerList({
          owners: removedOwners,
          title: `Remove owner${maybePlural(removedOwners)}`,
          icon: MinusIcon,
          className: 'mb-4 bg-[var(--color-warning-background)]',
        })}

      {addedOwners.length > 0 && renderOwnerList({ owners: addedOwners })}
    </FieldsGrid>
  )
}

function Signers({ signers }: { signers: ReactNode }): ReactElement {
  return (
    <FieldsGrid title="Signers">
      <div className="flex flex-col gap-4 p-[var(--space-2)] text-sm">{signers}</div>
    </FieldsGrid>
  )
}

function Threshold({ ownersCount, threshold }: { ownersCount: number; threshold: number }): ReactElement {
  return (
    <FieldsGrid title="Threshold">
      <span className="rounded-md bg-[var(--color-background-main)] px-2 py-1 font-bold">
        {threshold} of {ownersCount} signer{maybePlural(ownersCount)}
      </span>{' '}
      required to confirm new transactions
    </FieldsGrid>
  )
}

export type ManageSignersViewProps = {
  warning: ReactNode
  actions: ReactNode
  signers: ReactNode
  ownersCount: number
  threshold: number
}

export function ManageSignersView({
  warning,
  actions,
  signers,
  ownersCount,
  threshold,
}: ManageSignersViewProps): ReactElement {
  return (
    <div className="flex flex-col gap-6">
      {warning}

      {actions}

      <Signers signers={signers} />

      <Threshold ownersCount={ownersCount} threshold={threshold} />
    </div>
  )
}
