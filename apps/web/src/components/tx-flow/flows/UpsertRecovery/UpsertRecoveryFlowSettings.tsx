import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { ChevronUp as ExpandLessIcon, ChevronDown as ExpandMoreIcon } from 'lucide-react'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { useContext, useState } from 'react'
import type { ReactElement } from 'react'

import TxCard from '../../common/TxCard'
import { useRecoveryPeriods } from './useRecoveryPeriods'
import { UpsertRecoveryFlowFields, type UpsertRecoveryFlowProps } from '.'
import AddressBookInput from '@/components/common/AddressBookInput'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useSafeInfo from '@/hooks/useSafeInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import { RecovererWarning } from './RecovererSmartContractWarning'
import ExternalLink from '@/components/common/ExternalLink'
import { BRAND_NAME } from '@/config/constants'
import { TOOLTIP_TITLES } from '../../common/constants'
import Track from '@/components/common/Track'
import type { RecoveryStateItem } from '@/features/recovery'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import css from './styles.module.css'
import NumberField from '@/components/common/NumberField'
import { getDelay, isCustomDelaySelected } from './utils'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import { isSmartContractWallet } from '@/utils/wallets'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useChainId from '@/hooks/useChainId'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

enum AddressType {
  EOA = 'EOA',
  Safe = 'Safe',
  Other = 'Other',
}

export function UpsertRecoveryFlowSettings({ delayModifier }: { delayModifier?: RecoveryStateItem }): ReactElement {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const { data, onNext } = useContext<TxFlowContextType<UpsertRecoveryFlowProps>>(TxFlowContext)
  const [showAdvanced, setShowAdvanced] = useState(data?.[UpsertRecoveryFlowFields.expiry] !== '0')
  const [understandsRisk, setUnderstandsRisk] = useState(false)
  const periods = useRecoveryPeriods()
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

  const validateRecoverer = (recoverer: string) => {
    if (sameAddress(recoverer, safeAddress)) {
      return 'The Safe account cannot be a Recoverer of itself'
    }
  }

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
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(handleSubmit)}>
          <Alert variant="warning" className="border-0">
            <AlertDescription>
              Your Recoverer will be able to reset your Account setup. Only select an address that you trust.{' '}
              <Track {...RECOVERY_EVENTS.LEARN_MORE} label="recover-setup-flow">
                <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
                  Learn more
                </ExternalLink>
              </Track>
            </AlertDescription>
          </Alert>

          <div className="my-4">
            <Typography variant="h4" className="mb-2">
              Trusted Recoverer
            </Typography>

            <Typography variant="paragraph-small" className="block">
              Choose a Recoverer, such as a hardware wallet or a Safe account controlled by family or friends, that can
              initiate the recovery process in the future.
            </Typography>
          </div>

          <div className="mb-4 w-full">
            <AddressBookInput
              label="Recoverer address or ENS"
              name={UpsertRecoveryFlowFields.recoverer}
              required
              fullWidth
              validate={validateRecoverer}
            />
            <RecovererWarning />
          </div>

          <div className="mb-4">
            <Typography variant="h4" className="mb-2">
              Review window
              <Tooltip>
                <TooltipTrigger render={<span />}>
                  <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
                </TooltipTrigger>
                <TooltipContent>{TOOLTIP_TITLES.REVIEW_WINDOW}</TooltipContent>
              </Tooltip>
            </Typography>

            <Typography variant="paragraph-small" className="block">
              The recovery proposal will be available for execution after this period of time. You can cancel any
              recovery proposal when it is not needed or wanted during this period.
            </Typography>
          </div>

          <div className="my-4">
            <Controller
              control={formMethods.control}
              name={UpsertRecoveryFlowFields.selectedDelay}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="recovery-delay-select" className="w-[55%] max-w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.delay.map(({ label, value }, index) => (
                      <SelectItem key={index} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            <div className="flex max-w-[180px] min-w-[140px] flex-1 gap-4">
              {isCustomDelaySelected(selectedDelay) && (
                <>
                  <Controller
                    control={formMethods.control}
                    name={UpsertRecoveryFlowFields.customDelay}
                    rules={{ validate: validateCustomDelay }}
                    render={({ field, fieldState }) => (
                      <NumberField
                        label={fieldState.error?.message}
                        error={!!fieldState.error}
                        {...field}
                        required
                        placeholder="E.g. 100"
                      />
                    )}
                  />
                  <Typography className="my-auto">days.</Typography>
                </>
              )}
            </div>
          </div>

          <div className="mb-6">
            <Typography
              data-testid="advanced-btn"
              variant="paragraph-small"
              onClick={onShowAdvanced}
              role="button"
              className={css.advanced}
            >
              Advanced {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Typography>

            <Collapsible open={showAdvanced}>
              <CollapsibleContent keepMounted>
                <div>
                  <Typography variant="h4" className="mb-2">
                    Proposal expiry
                    <Tooltip>
                      <TooltipTrigger render={<span />}>
                        <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
                      </TooltipTrigger>
                      <TooltipContent>{TOOLTIP_TITLES.PROPOSAL_EXPIRY}</TooltipContent>
                    </Tooltip>
                  </Typography>

                  <Typography variant="paragraph-small" className="mb-4 block">
                    Set a period of time after which the recovery proposal will expire and can no longer be executed.
                  </Typography>
                </div>

                <Controller
                  control={formMethods.control}
                  name={UpsertRecoveryFlowFields.expiry}
                  // Don't reset value if advanced section is collapsed
                  shouldUnregister={false}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="recovery-expiry-select" className="w-[55%] max-w-[240px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.expiration.map(({ label, value }, index) => (
                          <SelectItem key={index} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator className={commonCss.nestedDivider} />

          <div data-testid="warning-section" className="my-4 flex items-start gap-2 pl-2">
            <Checkbox
              id="recovery-understands-risk"
              checked={understandsRisk}
              onCheckedChange={(checked) => setUnderstandsRisk(checked === true)}
            />
            <Label htmlFor="recovery-understands-risk" className="font-normal">
              {`I understand that the Recoverer will be able to initiate recovery of this Safe account and that I will only be informed within the ${BRAND_NAME}.`}
            </Label>
          </div>

          <div className="flex items-center">
            <Button data-testid="next-btn" variant="default" type="submit" disabled={isDisabled}>
              Next
            </Button>
          </div>
        </form>
      </FormProvider>
    </TxCard>
  )
}
