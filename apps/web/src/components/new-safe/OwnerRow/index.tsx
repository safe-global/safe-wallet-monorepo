import { useCallback, useEffect, useMemo } from 'react'
import NameInput from '@/components/common/NameInput'
import AddressBookInput from '@/components/common/AddressBookInput'
import { useFormContext, useWatch } from 'react-hook-form'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { NamedAddress } from '@/components/new-safe/create/types'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { addressIsNotCurrentSafe, addressIsNotReserved } from '@safe-global/utils/utils/validation'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import useSafeInfo from '@/hooks/useSafeInfo'
import { OwnerRowView } from '@views/components/new-safe/OwnerRow/OwnerRowView'

const OwnerRow = ({
  index,
  groupName,
  removable = true,
  remove,
  readOnly = false,
}: {
  index: number
  removable?: boolean
  groupName: string
  remove?: (index: number) => void
  readOnly?: boolean
}) => {
  const { safeAddress } = useSafeInfo()
  const wallet = useWallet()
  const fieldName = `${groupName}.${index}`
  const { control, getValues, setValue } = useFormContext()
  const owners = useWatch({
    control,
    name: groupName,
  })
  const owner = useWatch({
    control,
    name: fieldName,
  })

  const deps = useMemo(() => {
    return Array.from({ length: owners.length }, (_, i) => `${groupName}.${i}`)
  }, [owners, groupName])

  // Blocks the GS203/GS204 on-chain reverts before signing (WA-3005 Bucket A)
  const validateOwnerAddress = useCallback(
    async (address: string) => {
      const reservedError = addressIsNotReserved()(address)
      if (reservedError) {
        return reservedError
      }
      const currentSafeError = addressIsNotCurrentSafe(safeAddress)(address)
      if (currentSafeError) {
        return currentSafeError
      }
      const owners: NamedAddress[] = getValues(groupName)
      if (owners.filter((owner) => sameAddress(owner.address, address)).length > 1) {
        return getContractErrorMessage('GS204')
      }
    },
    [getValues, groupName, safeAddress],
  )

  const { name, ens, resolving } = useAddressResolver(owner.address)

  useEffect(() => {
    if (name && !getValues(`${fieldName}.name`)) {
      setValue(`${fieldName}.name`, name)
    }
  }, [setValue, getValues, name, fieldName])

  useEffect(() => {
    if (ens) {
      setValue(`${fieldName}.ens`, ens)
    }
  }, [ens, setValue, fieldName])

  const walletIsOwner = owner.address === wallet?.address
  return (
    <OwnerRowView
      index={index}
      removable={removable}
      readOnly={readOnly}
      walletIsOwner={walletIsOwner}
      ens={ens}
      resolving={resolving}
      renderNameInput={(props) => <NameInput name={`${fieldName}.name`} {...props} />}
      renderAddressInput={(props) => (
        <AddressBookInput
          name={`${fieldName}.address`}
          validate={validateOwnerAddress}
          deps={deps}
          onReset={() => setValue(`${fieldName}.name`, '')}
          {...props}
        />
      )}
      addressInfo={<EthHashInfo address={owner.address} shortAddress hasExplorer showCopyButton />}
      onRemove={() => remove?.(index)}
    />
  )
}

export default OwnerRow
