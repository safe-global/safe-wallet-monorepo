import { useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import NameInput from '@/components/common/NameInput'
import { largeFormFieldRowClassName } from '@/components/common/formFieldStyles'
import AddressBookInput from '@/components/common/AddressBookInput'
import DeleteIcon from '@/public/images/common/delete.svg'
import { useFormContext, useWatch } from 'react-hook-form'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { NamedAddress } from '@/components/new-safe/create/types'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import css from './styles.module.css'
import classNames from 'classnames'
import useSafeInfo from '@/hooks/useSafeInfo'

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

  const validateOwnerAddress = useCallback(
    async (address: string) => {
      if (sameAddress(address, safeAddress)) {
        return 'The Safe account cannot own itself'
      }
      const owners = getValues('owners')
      if (owners.filter((owner: NamedAddress) => sameAddress(owner.address, address)).length > 1) {
        return 'Signer is already added'
      }
    },
    [getValues, safeAddress],
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
    <div
      className={classNames('mb-6 grid grid-cols-12 items-end gap-6 max-md:flex-wrap', {
        [css.helper]: walletIsOwner,
      })}
    >
      <div className={readOnly ? 'col-span-12 md:col-span-5' : 'col-span-12 md:col-span-4'}>
        <div className="flex w-full flex-col">
          <NameInput
            data-testid="owner-name"
            name={`${fieldName}.name`}
            label="Signer name"
            InputLabelProps={{ shrink: true }}
            inputSize="hero"
            variant="surface"
            placeholder={ens || `Signer ${index + 1}`}
            helperText={walletIsOwner && 'Your connected wallet'}
            InputProps={{
              endAdornment: resolving ? (
                <div className="flex items-center">
                  <Spinner className="size-5" />
                </div>
              ) : null,
            }}
          />
        </div>
      </div>
      <div className={classNames('col-span-11 md:col-span-7', readOnly && largeFormFieldRowClassName)}>
        {readOnly ? (
          <EthHashInfo address={owner.address} shortAddress hasExplorer showCopyButton />
        ) : (
          <div className="flex w-full flex-col">
            <AddressBookInput
              name={`${fieldName}.address`}
              label="Signer"
              validate={validateOwnerAddress}
              deps={deps}
              onReset={() => setValue(`${fieldName}.name`, '')}
            />
          </div>
        )}
      </div>
      {!readOnly && (
        <div className="col-span-1 -ml-4 flex shrink-0 items-center self-stretch">
          {removable && (
            <Button
              variant="ghost"
              size="icon"
              data-testid="remove-owner-btn"
              onClick={() => remove?.(index)}
              aria-label="Remove signer"
            >
              <DeleteIcon />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default OwnerRow
