import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { useContext, type ReactElement } from 'react'

import InfoIcon from '@/public/images/notifications/info.svg'
import AddIcon from '@/public/images/common/add.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import TxCard from '@/components/tx-flow/common/TxCard'
import useSafeAddress from '@/hooks/useSafeAddress'
import useAddressBook from '@/hooks/useAddressBook'
import NameInput from '@/components/common/NameInput'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { validateDecimalLength, validateLimitedAmount } from '@safe-global/utils/utils/validation'
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
              inputSize="hero"
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
            {/* min-w-0 so the hero field can shrink instead of pushing the delete button off the row */}
            <div className="min-w-0 flex-1">
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
            </div>

            <div className={css.removeAsset}>
              <Button
                variant="ghost"
                size="icon"
                data-testid="remove-asset-icon"
                onClick={() => fieldArray.remove(index)}
              >
                <DeleteIcon className="size-4" />
              </Button>
            </div>
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
