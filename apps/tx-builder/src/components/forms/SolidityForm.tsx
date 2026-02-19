import { lazy, Suspense, useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'

const DevTool = lazy(() => import('@hookform/devtools').then((m) => ({ default: m.DevTool })))
import { getAddress, parseEther } from 'ethers'

import {
  ADDRESS_FIELD_TYPE,
  CONTRACT_METHOD_FIELD_TYPE,
  CUSTOM_TRANSACTION_DATA_FIELD_TYPE,
  NATIVE_AMOUNT_FIELD_TYPE,
} from './fields/fields'
import Field from './fields/Field'
import { encodeToHexData, getInputTypeHelper } from '../../utils'
import { ContractInterface, ProposedTransaction } from '../../typings/models'
import { isProdEnv } from '../../utils/env'

export const TO_ADDRESS_FIELD_NAME = 'toAddress'
export const NATIVE_VALUE_FIELD_NAME = 'nativeAmount'
export const CONTRACT_METHOD_INDEX_FIELD_NAME = 'contractMethodIndex'
export const CONTRACT_VALUES_FIELD_NAME = 'contractFieldsValues'
export const CUSTOM_TRANSACTION_DATA_FIELD_NAME = 'customTransactionData'

type SolidityFormPropsTypes = {
  id: string
  networkPrefix: undefined | string
  getAddressFromDomain: (name: string) => Promise<string>
  nativeCurrencySymbol: undefined | string
  contract: ContractInterface | null
  onSubmit: SubmitHandler<SolidityFormValuesTypes>
  initialValues?: Partial<SolidityInitialFormValuesTypes>
  showHexToggler?: boolean
  children: React.ReactNode
  showHexEncodedData: boolean
}

export type SolidityInitialFormValuesTypes = {
  [TO_ADDRESS_FIELD_NAME]: string
  [CONTRACT_METHOD_INDEX_FIELD_NAME]: string
}

export type SolidityFormValuesTypes = {
  [TO_ADDRESS_FIELD_NAME]: string
  [NATIVE_VALUE_FIELD_NAME]: string
  [CONTRACT_METHOD_INDEX_FIELD_NAME]: string
  [CONTRACT_VALUES_FIELD_NAME]: Record<string, Record<string, string>>
  [CUSTOM_TRANSACTION_DATA_FIELD_NAME]: string
}

export const parseFormToProposedTransaction = (
  values: SolidityFormValuesTypes,
  contract: ContractInterface | null,
  nativeCurrencySymbol: string | undefined,
  networkPrefix: string | undefined,
): ProposedTransaction => {
  const contractMethodIndex = values[CONTRACT_METHOD_INDEX_FIELD_NAME]
  const toAddress = values[TO_ADDRESS_FIELD_NAME]
  const tokenValue = values[NATIVE_VALUE_FIELD_NAME]
  const contractFieldsValues = values[CONTRACT_VALUES_FIELD_NAME]
  const methodValues = contractFieldsValues?.[`method-${contractMethodIndex}`]
  const customTransactionData = values[CUSTOM_TRANSACTION_DATA_FIELD_NAME]

  const contractMethod = contract?.methods[Number(contractMethodIndex)]

  const data = customTransactionData || encodeToHexData(contractMethod, methodValues) || '0x'
  const to = getAddress(toAddress)
  const value = parseEther(tokenValue || '0').toString()

  return {
    id: new Date().getTime(),
    contractInterface: contract,
    description: {
      to,
      value,
      customTransactionData,
      contractMethod,
      contractFieldsValues: methodValues,
      contractMethodIndex,
      nativeCurrencySymbol,
      networkPrefix,
    },
    raw: { to, value, data },
  }
}

const SolidityForm = ({
  id,
  onSubmit,
  getAddressFromDomain,
  initialValues,
  nativeCurrencySymbol,
  networkPrefix,
  contract,
  children,
  showHexEncodedData,
}: SolidityFormPropsTypes) => {
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    reset,
    formState: { isSubmitSuccessful, dirtyFields },
  } = useForm<SolidityFormValuesTypes>({
    defaultValues: initialValues,
    mode: 'onTouched', // This option allows you to configure the validation strategy before the user submits the form
  })

  const toAddress = watch(TO_ADDRESS_FIELD_NAME)
  const contractMethodIndex = watch(CONTRACT_METHOD_INDEX_FIELD_NAME)
  const nativeValue = watch(NATIVE_VALUE_FIELD_NAME)
  const customTransactionData = watch(CUSTOM_TRANSACTION_DATA_FIELD_NAME)
  const contractMethod = contract?.methods[Number(contractMethodIndex)]

  const contractFields = contractMethod?.inputs || []
  const showContractFields = !!contract && contract.methods.length > 0 && !showHexEncodedData
  const isPayableMethod = !!contract && contractMethod?.payable

  const isValueInputVisible = showHexEncodedData || !showContractFields || isPayableMethod

  useEffect(() => {
    const contractFieldsValues = getValues(CONTRACT_VALUES_FIELD_NAME)
    const methodValues = contractFieldsValues?.[`method-${contractMethodIndex}`]

    if (showHexEncodedData && contractMethod) {
      const encodeData = encodeToHexData(contractMethod, methodValues)
      setValue(CUSTOM_TRANSACTION_DATA_FIELD_TYPE, encodeData || '')
    }
  }, [contractMethod, getValues, setValue, showHexEncodedData, contractMethodIndex])

  // Resets form to initial values if the user edited contract method and then switched to custom data and edited it
  useEffect(() => {
    if (
      showHexEncodedData &&
      dirtyFields[CONTRACT_METHOD_INDEX_FIELD_NAME] &&
      dirtyFields[CUSTOM_TRANSACTION_DATA_FIELD_NAME]
    ) {
      reset({
        ...initialValues,
        [TO_ADDRESS_FIELD_NAME]: toAddress,
        [CUSTOM_TRANSACTION_DATA_FIELD_NAME]: customTransactionData,
        [NATIVE_VALUE_FIELD_NAME]: nativeValue,
      })
    }
  }, [dirtyFields, reset, showHexEncodedData, customTransactionData, toAddress, nativeValue, initialValues])

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset({ ...initialValues, [TO_ADDRESS_FIELD_NAME]: toAddress })
    }
  }, [isSubmitSuccessful, reset, toAddress, initialValues])

  return (
    <>
      <form id={id} data-testid={id} onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* To Address field */}
        <Field
          id="to-address-input"
          name={TO_ADDRESS_FIELD_NAME}
          label="To Address"
          fullWidth
          required
          getAddressFromDomain={getAddressFromDomain}
          networkPrefix={networkPrefix}
          fieldType={ADDRESS_FIELD_TYPE}
          control={control}
          showErrorsInTheLabel={false}
        />

        {/* Native Token Amount Input */}
        {isValueInputVisible && (
          <Field
            id="token-value-input"
            name={NATIVE_VALUE_FIELD_NAME}
            label={`${nativeCurrencySymbol} value`}
            fieldType={NATIVE_AMOUNT_FIELD_TYPE}
            fullWidth
            required
            control={control}
            showErrorsInTheLabel={false}
          />
        )}

        {/* Contract Section */}

        {/* Contract Method Selector */}
        {showContractFields && (
          <Field
            id="contract-method-selector"
            name={CONTRACT_METHOD_INDEX_FIELD_NAME}
            label="Contract Method Selector"
            fieldType={CONTRACT_METHOD_FIELD_TYPE}
            shouldUnregister={false}
            control={control}
            options={contract?.methods.map((method, index) => ({
              id: index.toString(),
              label: method.name,
            }))}
            required
          />
        )}

        {/* Contract Fields */}
        {contractFields.map((contractField, index) => {
          const name = `${CONTRACT_VALUES_FIELD_NAME}.method-${contractMethodIndex}.${contractField.name || index}`
          const fieldType = getInputTypeHelper(contractField)

          return (
            showContractFields && (
              <Field
                key={name}
                id={`contract-field-${contractField.name || index}`}
                name={name}
                label={`${contractField.name || `${index + 1}º contract field`} (${fieldType})`}
                fieldType={fieldType}
                fullWidth
                required
                shouldUnregister={false} // required to keep contract field values in the form state when the user switches between encoding and decoding data
                control={control}
                showErrorsInTheLabel={false}
                getAddressFromDomain={getAddressFromDomain}
                networkPrefix={networkPrefix}
              />
            )
          )
        })}

        {/* Hex encoded textarea field */}
        {showHexEncodedData && (
          <Field
            id="hex-encoded-data"
            name={CUSTOM_TRANSACTION_DATA_FIELD_NAME}
            label="Data (Hex encoded)"
            fieldType={CUSTOM_TRANSACTION_DATA_FIELD_TYPE}
            required
            fullWidth
            control={control}
            showErrorsInTheLabel={false}
          />
        )}
        {/* action buttons as a children */}
        {children}
      </form>

      {/* set up the dev tool only in dev env */}
      {!isProdEnv() && (
        <Suspense>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <DevTool control={control as any} />
        </Suspense>
      )}
    </>
  )
}

export default SolidityForm
