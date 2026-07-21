import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { useMemo, useContext } from 'react'
import type { ReactElement } from 'react'
import MinusIcon from '@/public/images/common/minus.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import FieldsGrid from '../../FieldsGrid'
import { getNewSafeSetup } from './get-new-safe-setup'
import { ChangeSignerSetupWarning } from '@/features/multichain'
import { OwnerList } from '@/components/tx-flow/common/OwnerList'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { ManageSignersForm } from '@/components/tx-flow/flows/ManagerSigners'
import type { AddOwnerFlowProps } from '@/components/tx-flow/flows/AddOwner'
import type { ReplaceOwnerFlowProps } from '@/components/tx-flow/flows/ReplaceOwner'
import type { TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'

type FlowData = ManageSignersForm | AddOwnerFlowProps | ReplaceOwnerFlowProps
function extractSignerNames(data?: FlowData): Record<string, string> {
  if (!data) return {}

  // ManageSigners flow
  if ('owners' in data) {
    return Object.fromEntries(
      data.owners.filter((owner) => owner.name).map((owner) => [checksumAddress(owner.address), owner.name]),
    )
  }
  // AddOwner/ReplaceOwner flows
  if ('newOwner' in data && data.newOwner.name) {
    return { [checksumAddress(data.newOwner.address)]: data.newOwner.name }
  }

  return {}
}

export function ManageSigners({
  txInfo,
  txData,
}: {
  txInfo: TransactionInfo
  txData: TransactionDetails['txData']
}): ReactElement {
  const { safe } = useSafeInfo()

  const { data } = useContext<TxFlowContextType<FlowData>>(TxFlowContext)
  const signerNames = useMemo(() => extractSignerNames(data), [data])

  const { newOwners, newThreshold } = useMemo(() => {
    return getNewSafeSetup({
      txInfo,
      txData,
      safe,
      signerNames,
    })
  }, [txInfo, txData, safe, signerNames])

  return (
    <div className="flex flex-col gap-6">
      <ChangeSignerSetupWarning />

      <Actions newOwners={newOwners} />

      <Signers owners={newOwners} />

      <Threshold owners={newOwners} threshold={newThreshold} />
    </div>
  )
}

function Actions({ newOwners }: { newOwners: Array<AddressInfo> }): ReactElement | null {
  const { safe } = useSafeInfo()

  const addedOwners = newOwners
    .filter((owner) => safe.owners.every(({ value }) => value !== owner.value))
    .map((addedOwner) => ({
      value: addedOwner.value,
      name: addedOwner.name ?? undefined,
    }))
  const removedOwners = safe.owners
    .filter((owner) => !newOwners.some((newOwner) => sameAddress(newOwner.value, owner.value)))
    .map((removedOwner) => ({
      value: removedOwner.value,
      name: removedOwner.name ?? undefined,
    }))

  if (addedOwners.length === 0 && removedOwners.length === 0) {
    return null
  }

  return (
    <FieldsGrid title="Actions">
      {removedOwners.length > 0 && (
        <OwnerList
          owners={removedOwners}
          title={`Remove owner${maybePlural(removedOwners)}`}
          icon={MinusIcon}
          className="mb-4 bg-[var(--color-warning-background)]"
        />
      )}

      {addedOwners.length > 0 && <OwnerList owners={addedOwners} />}
    </FieldsGrid>
  )
}

function Signers({ owners }: { owners: Array<AddressInfo> }): ReactElement {
  return (
    <FieldsGrid title="Signers">
      <div className="flex flex-col gap-4 p-[var(--space-2)] text-sm">
        {owners.map(({ value, name }) => (
          <NamedAddressInfo
            avatarSize={32}
            key={value}
            address={value}
            shortAddress={false}
            showCopyButton
            hasExplorer
            name={name}
          />
        ))}
      </div>
    </FieldsGrid>
  )
}

function Threshold({ owners, threshold }: { owners: Array<AddressInfo>; threshold: number }): ReactElement {
  return (
    <FieldsGrid title="Threshold">
      <span className="rounded-md bg-[var(--color-background-main)] px-2 py-1 font-bold">
        {threshold} of {owners.length} signer{maybePlural(owners)}
      </span>{' '}
      required to confirm new transactions
    </FieldsGrid>
  )
}
