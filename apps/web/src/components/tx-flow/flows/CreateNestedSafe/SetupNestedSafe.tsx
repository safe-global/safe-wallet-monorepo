import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import classNames from 'classnames'
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { useContext, type ReactElement } from 'react'

import InfoIcon from '@/public/images/notifications/info.svg'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import TxCard from '@/components/tx-flow/common/TxCard'
import useSafeAddress from '@/hooks/useSafeAddress'
import useAddressBook from '@/hooks/useAddressBook'
import NameInput from '@/components/common/NameInput'
import tokenInputCss from '@/components/common/TokenAmountInput/styles.module.css'
import NumberField from '@/components/common/NumberField'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { AutocompleteItem } from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import { validateDecimalLength, validateLimitedAmount } from '@safe-global/utils/utils/validation'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { useMnemonicPrefixedSafeName } from '@/hooks/useMnemonicName'
import css from '@/components/tx-flow/flows/CreateNestedSafe/styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'

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
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onFormSubmit)}>
          <Typography variant="paragraph-small" className="block mt-2">
            Name your Nested Safe and select which assets to fund it with. All selected assets will be transferred when
            deployed.
          </Typography>

          <div className="mt-6 w-full">
            <NameInput
              data-testid="nested-safe-name-input"
              name={SetupNestedSafeFormFields.name}
              label="Name"
              placeholder={fallbackName}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className="flex">
                          <InfoIcon className="size-4" />
                        </span>
                      }
                    />
                    <TooltipContent>
                      This name is stored locally and will never be shared with us or any third parties.
                    </TooltipContent>
                  </Tooltip>
                ),
              }}
            />
          </div>

          <AssetInputs name={SetupNestedSafeFormFields.assets} />

          <Separator className={commonCss.nestedDivider} />

          <div className="flex items-center p-2">
            <Button data-testid="next-button" type="submit">
              Next
            </Button>
          </div>
        </form>
      </FormProvider>
    </TxCard>
  )
}

/**
 * Note: the following is very similar to TokenAmountInput but with key differences to support
 * a field array. Adjusting the former was initially attempted but proved to be too complex.
 *
 * TODO: Refactor the both to share a common implementation.
 */
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
    <>
      {fieldArray.fields.map((field, index) => {
        const errors = formMethods.formState.errors?.[name]?.[index]
        const label =
          errors?.[SetupNestedSafeFormAssetFields.tokenAddress]?.message ||
          errors?.[SetupNestedSafeFormAssetFields.amount]?.message ||
          'Amount'
        const isError = !!errors && Object.keys(errors).length > 0

        const thisAsset = balances.items.find((item) => {
          return item.tokenInfo.address === selectedAssets[index][SetupNestedSafeFormAssetFields.tokenAddress]
        })
        const thisAndNonSelectedAssets = balances.items.filter((item) => {
          return (
            item.tokenInfo.address === thisAsset?.tokenInfo.address ||
            nonSelectedAssets.some((nonSelected) => item.tokenInfo.address === nonSelected.tokenInfo.address)
          )
        })
        return (
          <div data-testid="asset-data" className={css.assetInput} key={field.id}>
            <div className={classNames(tokenInputCss.outline, { [tokenInputCss.error]: isError }, 'w-full')}>
              <label className={classNames(tokenInputCss.label, 'block text-xs font-medium')}>{label}</label>

              <div className={tokenInputCss.inputs}>
                <Controller
                  name={`${name}.${index}.${SetupNestedSafeFormAssetFields.amount}`}
                  rules={{
                    required: true,
                    validate: (value) => {
                      return (
                        validateLimitedAmount(value, thisAsset?.tokenInfo.decimals, thisAsset?.balance) ||
                        validateDecimalLength(value, thisAsset?.tokenInfo.decimals)
                      )
                    },
                  }}
                  render={({ field }) => {
                    const onClickMax = () => {
                      if (thisAsset) {
                        const maxAmount = safeFormatUnits(thisAsset.balance, thisAsset.tokenInfo.decimals)
                        field.onChange(maxAmount)
                      }
                    }
                    return (
                      <NumberField
                        data-testid="amount-input"
                        endAdornment={
                          <Button
                            variant="ghost"
                            data-testid="max-button"
                            className={tokenInputCss.max}
                            onClick={onClickMax}
                          >
                            Max
                          </Button>
                        }
                        className={tokenInputCss.amount}
                        required
                        placeholder="0"
                        {...field}
                      />
                    )
                  }}
                />

                <Separator orientation="vertical" className="h-auto self-stretch" />

                <Controller
                  name={`${name}.${index}.${SetupNestedSafeFormAssetFields.tokenAddress}`}
                  rules={{ required: true, deps: [`${name}.${index}.${SetupNestedSafeFormAssetFields.amount}`] }}
                  render={({ field }) => {
                    return (
                      <div data-testid="token-selector" className={tokenInputCss.select}>
                        <Select value={field.value} onValueChange={field.onChange} required>
                          <SelectTrigger className="min-w-[200px]">
                            <SelectValue>{thisAsset && <AutocompleteItem {...thisAsset} />}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {thisAndNonSelectedAssets.map((item) => (
                              <SelectItem key={item.tokenInfo.address} value={item.tokenInfo.address}>
                                <AutocompleteItem {...item} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  }}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              data-testid="remove-asset-icon"
              onClick={() => fieldArray.remove(index)}
            >
              <DeleteIcon className="size-4" />
            </Button>
          </div>
        )
      })}

      <Button
        data-testid="fund-asset-button"
        variant="ghost"
        onClick={() => {
          fieldArray.append(defaultAsset, { shouldFocus: true })
        }}
        size="lg"
        className="my-6 self-start"
        disabled={nonSelectedAssets.length === 0}
      >
        <AddIcon className="size-4" />
        Fund new asset
      </Button>
    </>
  )
}
