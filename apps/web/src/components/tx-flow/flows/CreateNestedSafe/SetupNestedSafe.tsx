import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { useContext, type ReactElement } from 'react'

import useSafeAddress from '@/hooks/useSafeAddress'
import useAddressBook from '@/hooks/useAddressBook'
import NameInput from '@/components/common/NameInput'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { validateDecimalLength, validateLimitedAmount } from '@safe-global/utils/utils/validation'
import { useMnemonicPrefixedSafeName } from '@/hooks/useMnemonicName'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import {
  AssetInputsView,
  SetupNestedSafeView,
} from '@views/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafeView'

export type SetupNestedSafeForm = {
  [SetupNestedSafeFormFields.name]: string
  [SetupNestedSafeFormFields.assets]: Array<Record<SetupNestedSafeFormAssetFields, string>>
}

export enum SetupNestedSafeFormFields {
  name = 'name',
  assets = 'assets',
}

export enum SetupNestedSafeFormAssetFields {
  tokenAddress = 'tokenAddress',
  amount = 'amount',
}

export function SetUpNestedSafe(): ReactElement {
  const addressBook = useAddressBook()
  const safeAddress = useSafeAddress()
  const randomName = useMnemonicPrefixedSafeName('Nested')
  const fallbackName = addressBook[safeAddress] ?? randomName
  const { onNext, data } = useContext<TxFlowContextType<SetupNestedSafeForm>>(TxFlowContext)

  const formMethods = useForm<SetupNestedSafeForm>({
    defaultValues: data,
    mode: 'onChange',
  })

  const onFormSubmit = (data: SetupNestedSafeForm) => {
    onNext({
      ...data,
      [SetupNestedSafeFormFields.name]: data[SetupNestedSafeFormFields.name] || fallbackName,
    })
  }

  return (
    <FormProvider {...formMethods}>
      <SetupNestedSafeView
        onSubmit={formMethods.handleSubmit(onFormSubmit)}
        nameFieldName={SetupNestedSafeFormFields.name}
        fallbackName={fallbackName}
        renderNameInput={(props) => <NameInput {...props} />}
        assetInputs={<AssetInputs name={SetupNestedSafeFormFields.assets} />}
      />
    </FormProvider>
  )
}

function AssetInputs({ name }: { name: SetupNestedSafeFormFields.assets }) {
  const { balances } = useVisibleBalances()

  const formMethods = useFormContext<SetupNestedSafeForm>()
  const fieldArray = useFieldArray<SetupNestedSafeForm>({ name })

  const selectedAssets = formMethods.watch(name)
  const nonSelectedAssets = balances.items.filter((item) => {
    return !selectedAssets.map((asset) => asset.tokenAddress).includes(item.tokenInfo.address)
  })
  const defaultAsset: SetupNestedSafeForm[typeof name][number] = {
    tokenAddress: nonSelectedAssets[0]?.tokenInfo.address,
    amount: '',
  }

  return (
    <AssetInputsView
      rows={fieldArray.fields.map((field, index) => {
        const thisAsset = balances.items.find((item) => {
          return item.tokenInfo.address === selectedAssets[index][SetupNestedSafeFormAssetFields.tokenAddress]
        })
        const thisAndNonSelectedAssets = balances.items.filter((item) => {
          return (
            item.tokenInfo.address === thisAsset?.tokenInfo.address ||
            nonSelectedAssets.some((nonSelected) => item.tokenInfo.address === nonSelected.tokenInfo.address)
          )
        })
        return {
          id: field.id,
          tokenInput: (
            <TokenAmountInput
              fieldArray={{ name, index }}
              balances={thisAndNonSelectedAssets}
              selectedToken={thisAsset}
              maxAmount={thisAsset ? BigInt(thisAsset.balance) : undefined}
              validate={(value) =>
                validateLimitedAmount(value, thisAsset?.tokenInfo.decimals, thisAsset?.balance) ||
                validateDecimalLength(value, thisAsset?.tokenInfo.decimals)
              }
              deps={[name]}
              defaultTokenAddress={thisAsset?.tokenInfo.address}
            />
          ),
          onRemove: () => fieldArray.remove(index),
        }
      })}
      onAdd={() => {
        fieldArray.append(defaultAsset, { shouldFocus: true })
      }}
      addDisabled={nonSelectedAssets.length === 0}
    />
  )
}
