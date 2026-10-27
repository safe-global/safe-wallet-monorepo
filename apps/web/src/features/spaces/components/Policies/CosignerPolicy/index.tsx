import { useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Toggle } from '@safe-global/views/components/ui/toggle'
import { Typography } from '@safe-global/views/components/ui/typography'
import { getAddress, isAddress } from 'ethers'
import type { Address } from 'viem'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { AvailablePolicy, ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { Code, Target, UserCheck } from 'lucide-react'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useSpaceSafes } from '@/features/spaces'
import { SafeIdenticon } from '../shared/safeIdentity'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import {
  WizardLayout,
  VerticalWizard,
  FormHeader,
  ApplyToStep,
  PolicySummaryRow,
  WizardField,
  safeKey,
  type SafeRowItem,
} from '../wizardCommon'
import { flattenSafes } from '../safeRefs'
import { usePolicyGuard } from '../hooks/usePolicyGuard'
import { useDefaultFallbackPolicy } from '../shared/useDefaultFallbackPolicy'
import { GUARD_READ_ERROR } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { INELIGIBILITY_TEXT } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
import { useStorePolicyRequest } from '../hooks/useStorePolicyRequest'
import { useAvailablePolicies } from '../hooks/useAvailablePolicies'
import { useActivePolicies } from '../hooks/useActivePolicies'
import { useReplacedPolicies } from '../hooks/useReplacedPolicies'
import { ReplacedPolicyWarning } from '../shared/ReplacedPolicyWarning'
import { NO_SELECTOR, OPERATION_CALL, OPERATION_DELEGATECALL } from '../shared/accessSelector'
import { buildCosignerBatch } from './buildBatch'

const ALL_STEPS = [
  { key: 'apply-to', label: 'Select Safe' },
  { key: 'access', label: 'Which calls' },
  { key: 'cosigner', label: 'Cosigner' },
  { key: 'review', label: 'Review' },
] as const
type StepKey = (typeof ALL_STEPS)[number]['key']

/**
 * The SafePolicyGuard + CoSignerPolicy addresses to build against, from the catalogue,
 * falling back to the Safe's active policy of the same type when CGW reports no wiring.
 */
const useCosignerPolicyContracts = (
  chainId: string,
  safeAddress: string,
): { safePolicyGuard?: string; policyContract?: string } => {
  const { policies: catalogue } = useAvailablePolicies(chainId, safeAddress)
  const { policies: active } = useActivePolicies(chainId, safeAddress)

  return useMemo(() => {
    const enforcements = [
      catalogue.find((p: AvailablePolicy) => p.type === PolicyType.Cosigner)?.enforcement,
      active.find((p: ActivePolicy) => p.type === PolicyType.Cosigner)?.enforcement,
    ]
    const guardEnforcement = enforcements.find((enforcement) => enforcement?.via === 'guard')
    const contracts = guardEnforcement?.via === 'guard' ? guardEnforcement.guards.transactionGuard : undefined

    return { safePolicyGuard: contracts?.safePolicyGuard, policyContract: contracts?.policyContract }
  }, [catalogue, active])
}

const CosignerPolicyFlow = () => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { allSafes, isLoading: safesLoading } = useSpaceSafes()
  const safes = useMemo<SafeRowItem[]>(() => flattenSafes(allSafes), [allSafes])

  // The policies page picks the Safe before opening the wizard.
  const preselectedKey = typeof router.query.policySafe === 'string' ? router.query.policySafe.toLowerCase() : ''
  const STEPS = useMemo(
    () => (preselectedKey ? ALL_STEPS.filter((step) => step.key !== 'apply-to') : ALL_STEPS),
    [preselectedKey],
  )

  const [stepIndex, setStepIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState(preselectedKey)
  const [targetInput, setTargetInput] = useState('')
  const [selectorInput, setSelectorInput] = useState('')
  const [operation, setOperation] = useState(OPERATION_CALL)
  const [cosignerInput, setCosignerInput] = useState('')

  const selectedSafe = useMemo(() => safes.find((s) => safeKey(s) === selectedKey), [safes, selectedKey])
  const chainId = selectedSafe?.chainId ?? ''
  const safeAddress = selectedSafe?.address ?? ''

  const { safePolicyGuard: guardAddress, policyContract } = useCosignerPolicyContracts(chainId, safeAddress)
  const hasPolicyContracts = !!guardAddress && !!policyContract

  const {
    currentGuard,
    currentModuleGuard,
    isSet: isGuardSet,
    isUnknownGuard,
    isUnsupportedVersion,
    isLoading: isGuardLoading,
    error: guardError,
  } = usePolicyGuard(chainId, safeAddress, guardAddress)
  const defaultFallbackPolicy = useDefaultFallbackPolicy(chainId)
  // Without both guard slots read, the batch could apply a change that has to be requested
  const isGuardBlocked = isGuardLoading || isUnsupportedVersion || !!guardError

  const targetTrimmed = targetInput.trim()
  const isTargetValid = isAddress(targetTrimmed)
  const selectorTrimmed = selectorInput.trim()
  // Empty is meaningful: calls that carry no function data, i.e. plain value transfers.
  const isSelectorValid = selectorTrimmed === '' || /^0x[0-9a-fA-F]{8}$/.test(selectorTrimmed)

  const access = useMemo(
    () => ({ target: targetTrimmed, selector: selectorTrimmed || NO_SELECTOR, operation }),
    [targetTrimmed, selectorTrimmed, operation],
  )

  const { setTxFlow } = useContext(TxModalContext)
  const dispatch = useAppDispatch()
  const storePolicyRequest = useStorePolicyRequest()

  // The guard keeps one policy per access, so an occupied access is replaced silently.
  const replaced = useReplacedPolicies(
    chainId,
    safeAddress,
    useMemo(() => (isTargetValid ? [{ ...access, policy: '', data: '' }] : []), [access, isTargetValid]),
  )

  const cosignerTrimmed = cosignerInput.trim()
  const isCosignerValid = isAddress(cosignerTrimmed)
  // A Safe cosigning its own transactions could never satisfy the check.
  const isCosignerSelf = isCosignerValid && cosignerTrimmed.toLowerCase() === safeAddress.toLowerCase()

  const continueDisabled = (() => {
    const step = STEPS[stepIndex].key as StepKey
    if (step === 'apply-to') return !selectedSafe
    if (step === 'access') return !isTargetValid || !isSelectorValid
    if (step === 'cosigner') return !isCosignerValid || isCosignerSelf
    return !hasPolicyContracts || isGuardBlocked
  })()

  const goBack = () => {
    if (stepIndex === 0) {
      void router.push({ pathname: AppRoutes.spaces.policies, query: { spaceId: router.query.spaceId } })
      return
    }
    setStepIndex((i) => i - 1)
  }

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1)
    else onReview()
  }

  const onReview = async () => {
    if (isGuardBlocked || !selectedSafe || !guardAddress || !policyContract || !isCosignerValid) return

    const { txs, mode, configurations, configureRoot } = buildCosignerBatch({
      safeAddress: safeAddress as Address,
      currentGuard: currentGuard as Address | undefined,
      currentModuleGuard: currentModuleGuard as Address | undefined,
      fallbackPolicy: defaultFallbackPolicy,
      safePolicyGuard: guardAddress as Address,
      policyContract: policyContract as Address,
      cosigner: getAddress(cosignerTrimmed) as Address,
      accesses: [access],
      allowOverwriteGuard: isUnknownGuard,
    })

    const isRequest = mode === 'request'
    const subtitle = isRequest ? 'Request cosigner change' : 'Cosigner policy'

    if (isRequest) {
      const stored = await storePolicyRequest({ chainId, safeAddress, root: configureRoot, configurations })

      if (!stored.ok && stored.isCapReached) {
        dispatch(
          showNotification({
            message: 'This Safe has too many pending policy requests. Apply or cancel some to see this one’s details.',
            variant: 'warning',
            groupKey: 'policy-request-store-cap',
          }),
        )
      }
    }

    const chain = chains.find((c) => c.chainId === chainId)
    if (chain) {
      await router.replace(
        { pathname: router.pathname, query: { ...router.query, safe: `${chain.shortName}:${safeAddress}` } },
        undefined,
        { shallow: true },
      )
    }

    setTxFlow(<PolicyBatchFlow txs={txs} subtitle={subtitle} />)
  }

  const step = STEPS[stepIndex].key as StepKey

  return (
    <WizardLayout
      wizard={<VerticalWizard steps={STEPS} currentIndex={stepIndex} />}
      form={
        <>
          <FormHeader
            currentIndex={stepIndex}
            onBack={goBack}
            onNext={goNext}
            continueDisabled={continueDisabled}
            isReview={step === 'review'}
            isSubmitting={false}
          />

          {step === 'apply-to' && (
            <ApplyToStep
              safes={safes}
              isLoading={safesLoading}
              selectedKey={selectedKey}
              onSelect={(s) => setSelectedKey(safeKey(s))}
            />
          )}

          {step === 'access' && (
            <div className="flex flex-col gap-4">
              <Typography variant="h3">Which calls need a cosigner?</Typography>
              <Typography variant="paragraph-small" className="text-muted-foreground">
                A policy is bound to a target, a function and an operation. Amounts aren&apos;t part of that, so the
                cosigner is required however much the call moves.
              </Typography>

              <div className="flex flex-col gap-2">
                <Typography variant="paragraph-small-bold" className="text-muted-foreground">
                  To (target)
                </Typography>
                <WizardField
                  icon={<Target size={16} color="#737373" />}
                  value={targetInput}
                  onChange={setTargetInput}
                  placeholder="0x… contract or account this policy covers"
                  state={targetTrimmed === '' ? 'default' : isTargetValid ? 'valid' : 'error'}
                  ariaLabel="Target address"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Typography variant="paragraph-small-bold" className="text-muted-foreground">
                  Function selector
                </Typography>
                <WizardField
                  icon={<Code size={16} color="#737373" />}
                  value={selectorInput}
                  onChange={setSelectorInput}
                  placeholder="0xa9059cbb — leave empty for plain value transfers"
                  state={selectorTrimmed === '' ? 'default' : isSelectorValid ? 'valid' : 'error'}
                  ariaLabel="Function selector"
                />
                <Typography variant="paragraph-mini" className="text-muted-foreground">
                  {selectorTrimmed === ''
                    ? 'Empty covers calls that carry no function data — a plain value transfer.'
                    : 'The 4-byte selector of the function to cover, e.g. 0xa9059cbb for an ERC-20 transfer.'}
                </Typography>
              </div>

              <div className="flex flex-col gap-2">
                <Typography variant="paragraph-small-bold" className="text-muted-foreground">
                  Operation
                </Typography>
                {/* Exclusive pair: pressing one selects it, so neither can be toggled off into
                    an empty state the way a bare Toggle would allow. */}
                <div className="flex flex-row gap-1" role="group" aria-label="Operation">
                  <Toggle
                    pressed={operation === OPERATION_CALL}
                    onPressedChange={() => setOperation(OPERATION_CALL)}
                    aria-label="Call"
                    size="sm"
                  >
                    Call
                  </Toggle>
                  <Toggle
                    pressed={operation === OPERATION_DELEGATECALL}
                    onPressedChange={() => setOperation(OPERATION_DELEGATECALL)}
                    aria-label="Delegate call"
                    size="sm"
                  >
                    Delegate call
                  </Toggle>
                </div>
              </div>
            </div>
          )}

          {step === 'cosigner' && (
            <div className="flex flex-col gap-4">
              <Typography variant="h3">Who has to cosign?</Typography>
              <Typography variant="paragraph-small" className="text-muted-foreground">
                Every transfer of the selected tokens will need this address&apos;s signature, whatever the amount — the
                policy has no threshold.
              </Typography>

              <WizardField
                icon={<UserCheck size={16} color="#737373" />}
                value={cosignerInput}
                onChange={setCosignerInput}
                placeholder="0x… cosigner address"
                state={cosignerTrimmed === '' ? 'default' : isCosignerValid && !isCosignerSelf ? 'valid' : 'error'}
                ariaLabel="Cosigner address"
              />

              {isCosignerSelf && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>
                    The Safe can&apos;t cosign its own transactions. Choose a different address.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-col gap-4">
              <Typography variant="h3">Review</Typography>

              {/* The guard reads the cosigner's signature from the tail of the `signatures`
                  bytes, which this wallet doesn't append yet. */}
              <Alert variant="warning">
                <AlertSeverityIcon variant="warning" />
                <AlertDescription>
                  A cosigner&apos;s signature will be required at execution for the combination of (to, selector,
                  operation).
                </AlertDescription>
              </Alert>

              <ReplacedPolicyWarning policies={replaced} />

              {!hasPolicyContracts && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>
                    The policy engine isn&apos;t available for this Safe&apos;s network yet, so this change can&apos;t
                    be created.
                  </AlertDescription>
                </Alert>
              )}

              {isUnsupportedVersion && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>{INELIGIBILITY_TEXT['unsupported-safe-version']}</AlertDescription>
                </Alert>
              )}

              {guardError && (
                <Alert variant="destructive">
                  <AlertSeverityIcon variant="destructive" />
                  <AlertDescription>{GUARD_READ_ERROR}</AlertDescription>
                </Alert>
              )}

              {isUnknownGuard && (
                <Alert variant="warning">
                  <AlertSeverityIcon variant="warning" />
                  <AlertDescription>
                    This Safe already has a different transaction or module guard. Continuing will overwrite it.
                  </AlertDescription>
                </Alert>
              )}

              {isGuardSet && (
                <Alert variant="info">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>
                    This Safe already has the policy guard, so this change is time-locked. You&apos;ll request it now
                    and apply it after the guard&apos;s delay has passed.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-2xl border border-border px-4 py-2">
                <PolicySummaryRow
                  label="Safe"
                  isFirst
                  value={
                    selectedSafe && (
                      <div className="flex flex-row items-center gap-2">
                        <SafeIdenticon address={selectedSafe.address} size={20} />
                        <Typography variant="paragraph-small-bold">{selectedSafe.name || 'Safe'}</Typography>
                        <Typography variant="paragraph-small" className="text-muted-foreground tabular-nums">
                          {shortenAddress(selectedSafe.address)}
                        </Typography>
                      </div>
                    )
                  }
                />

                <PolicySummaryRow
                  label="To"
                  value={
                    isTargetValid && (
                      <div className="flex flex-row items-center gap-2">
                        <SafeIdenticon address={targetTrimmed} size={16} />
                        <Typography variant="paragraph-small-bold">{shortenAddress(targetTrimmed)}</Typography>
                      </div>
                    )
                  }
                />

                <PolicySummaryRow
                  label="Function"
                  value={
                    <Typography variant="paragraph-small-bold" className="font-mono">
                      {selectorTrimmed || 'value transfer (no selector)'}
                    </Typography>
                  }
                />

                <PolicySummaryRow
                  label="Operation"
                  value={
                    <Typography variant="paragraph-small-bold">
                      {operation === OPERATION_DELEGATECALL ? 'Delegate call' : 'Call'}
                    </Typography>
                  }
                />

                <PolicySummaryRow
                  label="Cosigner"
                  value={
                    isCosignerValid && (
                      <div className="flex flex-row items-center gap-2">
                        <SafeIdenticon address={cosignerTrimmed} size={16} />
                        <Typography variant="paragraph-small-bold">{shortenAddress(cosignerTrimmed)}</Typography>
                      </div>
                    )
                  }
                />
              </div>
            </div>
          )}
        </>
      }
      summary={null}
    />
  )
}

export default CosignerPolicyFlow
