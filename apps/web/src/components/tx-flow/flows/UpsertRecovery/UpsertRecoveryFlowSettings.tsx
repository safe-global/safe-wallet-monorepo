import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { useContext, useState } from 'react'
import type { ReactElement } from 'react'

import { useRecoveryPeriods } from './useRecoveryPeriods'
import { UpsertRecoveryFlowFields, type UpsertRecoveryFlowProps } from '.'
import AddressBookInput from '@/components/common/AddressBookInput'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { addressIsNotReserved } from '@safe-global/utils/utils/validation'
import useSafeInfo from '@/hooks/useSafeInfo'
import { RecovererWarning } from './RecovererSmartContractWarning'
import { BRAND_NAME } from '@/config/constants'
import type { RecoveryStateItem } from '@/features/recovery'

import { getDelay, isCustomDelaySelected } from './utils'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import { isSmartContractWallet } from '@/utils/wallets'
import { clickOnEnterOrSpace } from '@/utils/keyboard'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useChainId from '@/hooks/useChainId'
import {
  CustomDelayFieldView,
  RecoveryPeriodSelectView,
  UpsertRecoveryFlowSettingsView,
} from '@views/components/tx-flow/flows/UpsertRecovery/UpsertRecoveryFlowSettingsView'

enum AddressType {
  EOA = 'EOA',
  Safe = 'Safe',
  Other = 'Other',
}

export function _validateRecoverer(recoverer: string, safeAddress: string): string | undefined {
  // Reserved (zero/sentinel) addresses would break the module on-chain. The
  // shared GS203 copy names a signer, which a Recoverer is not.
  const reservedError = addressIsNotReserved('This Recoverer address is not valid')(recoverer)
  if (reservedError) {
    return reservedError
  }

  if (sameAddress(recoverer, safeAddress)) {
    return 'The Safe account cannot be a Recoverer of itself'
  }
}

export function UpsertRecoveryFlowSettings({ delayModifier }: { delayModifier?: RecoveryStateItem }): ReactElement {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const { data, onNext } = useContext<TxFlowContextType<UpsertRecoveryFlowProps>>(TxFlowContext)
  const [showAdvanced, setShowAdvanced] = useState(data?.[UpsertRecoveryFlowFields.expiry] !== '0')
  const [understandsRisk, setUnderstandsRisk] = useState(false)
  const periods = useRecoveryPeriods()
  const delayItems = Object.fromEntries(periods.delay.map(({ value, label }) => [value, label]))
  const expirationItems = Object.fromEntries(periods.expiration.map(({ value, label }) => [value, label]))
  const [triggerGetSafe] = useLazySafesGetSafeV1Query()

  const getAddressType = async (address: string, chainId: string) => {
    const isSmartContract = await isSmartContractWallet(chainId, address)
    if (!isSmartContract) return AddressType.EOA

    try {
      const result = await triggerGetSafe({ chainId, safeAddress: address }).unwrap()
      if (result) return AddressType.Safe
    } catch {
      // Not a safe
    }

    return AddressType.Other
  }

  const formMethods = useForm<UpsertRecoveryFlowProps>({
    defaultValues: data,
    mode: 'onChange',
  })

  const recoverer = formMethods.watch(UpsertRecoveryFlowFields.recoverer)

  // Copilot address-poisoning check for the recoverer
  useSafeShieldForAddressPoisoning([recoverer])
  const expiry = formMethods.watch(UpsertRecoveryFlowFields.expiry)
  const selectedDelay = formMethods.watch(UpsertRecoveryFlowFields.selectedDelay)
  const customDelay = formMethods.watch(UpsertRecoveryFlowFields.customDelay)
  const customDelayState = formMethods.getFieldState(UpsertRecoveryFlowFields.customDelay)

  const delay = getDelay(customDelay, selectedDelay)

  // RHF's dirty check is tempermental with our address input dropdown
  const isDirty = delayModifier
    ? // Updating settings
      !sameAddress(recoverer, delayModifier.recoverers[0]) ||
      delayModifier.delay !== BigInt(delay) ||
      delayModifier.expiry !== BigInt(expiry)
    : // Setting up recovery
      recoverer && delay && expiry

  const validateRecoverer = (recoverer: string) => _validateRecoverer(recoverer, safeAddress)

  const validateCustomDelay = (delay: string) => {
    if (!delay) return ''
    if (delay === '0' || !Number.isInteger(Number(delay))) {
      return 'Invalid number'
    }
  }

  const onShowAdvanced = () => {
    setShowAdvanced((prev) => !prev)
    trackEvent(RECOVERY_EVENTS.SHOW_ADVANCED)
  }

  const isDisabled = !understandsRisk || !isDirty || !!customDelayState.error

  const isEdit = !!delayModifier

  const handleSubmit = async () => {
    const addressType = await getAddressType(recoverer, chainId)
    const creationEvent = isEdit ? RECOVERY_EVENTS.SUBMIT_RECOVERY_EDIT : RECOVERY_EVENTS.SUBMIT_RECOVERY_CREATE
    const settings = `delay_${delay},expiry_${expiry},type_${addressType}`

    trackEvent({ ...creationEvent })
    trackEvent({ ...RECOVERY_EVENTS.RECOVERY_SETTINGS, label: settings })

    onNext({ expiry, delay, customDelay, selectedDelay, recoverer, moduleAddress: data?.moduleAddress })
  }

  return (
    <FormProvider {...formMethods}>
      <UpsertRecoveryFlowSettingsView
        onSubmit={formMethods.handleSubmit(handleSubmit)}
        renderRecovererInput={(label) => (
          <AddressBookInput
            label={label}
            name={UpsertRecoveryFlowFields.recoverer}
            required
            fullWidth
            validate={validateRecoverer}
          />
        )}
        recovererWarning={<RecovererWarning />}
        delaySelect={
          <Controller
            control={formMethods.control}
            name={UpsertRecoveryFlowFields.selectedDelay}
            render={({ field }) => (
              <RecoveryPeriodSelectView
                value={field.value}
                onValueChange={field.onChange}
                items={delayItems}
                options={periods.delay}
                testId="recovery-delay-select"
              />
            )}
          />
        }
        isCustomDelay={isCustomDelaySelected(selectedDelay)}
        customDelayField={
          <Controller
            control={formMethods.control}
            name={UpsertRecoveryFlowFields.customDelay}
            rules={{ validate: validateCustomDelay }}
            render={({ field, fieldState }) => (
              <CustomDelayFieldView errorMessage={fieldState.error?.message} hasError={!!fieldState.error} {...field} />
            )}
          />
        }
        expirySelect={
          <Controller
            control={formMethods.control}
            name={UpsertRecoveryFlowFields.expiry}
            // Don't reset value if advanced section is collapsed
            shouldUnregister={false}
            render={({ field }) => (
              <RecoveryPeriodSelectView
                value={field.value}
                onValueChange={field.onChange}
                items={expirationItems}
                options={periods.expiration}
                testId="recovery-expiry-select"
              />
            )}
          />
        }
        showAdvanced={showAdvanced}
        onShowAdvanced={onShowAdvanced}
        onAdvancedKeyDown={clickOnEnterOrSpace}
        understandsRisk={understandsRisk}
        onUnderstandsRiskChange={setUnderstandsRisk}
        brandName={BRAND_NAME}
        isDisabled={isDisabled}
      />
    </FormProvider>
  )
}
