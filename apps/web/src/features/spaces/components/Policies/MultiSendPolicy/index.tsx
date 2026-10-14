import { useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useSpaceSafes } from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import {
  WizardLayout,
  VerticalWizard,
  FormHeader,
  ApplyToStep,
  PolicySummaryRow,
  safeKey,
  type SafeRowItem,
} from '../wizardCommon'
import { flattenSafes } from '../safeRefs'
import { usePolicyGuard } from '../hooks/usePolicyGuard'
import { useStorePolicyRequest } from '../hooks/useStorePolicyRequest'
import { useReplacedPolicies } from '../hooks/useReplacedPolicies'
import { ReplacedPolicyWarning } from '../shared/ReplacedPolicyWarning'
import { savePolicyRequestApi } from '../policyRequestStore'
import { POLICY_GUARD_DELAY_SEC } from '../shared/guardTx'
import { OPERATION_DELEGATECALL } from '../shared/accessSelector'
import { usePolicyContracts } from '../shared/usePolicyContracts'
import { buildMultiSendPolicyBatch } from './buildBatch'
import { getMultiSendAddress } from './multiSendAddress'
import { MULTI_SEND_SELECTOR } from './contracts'

/**
 * Puts the calls inside a batch under the Safe's other policies.
 *
 * A batch reaches the guard as a single `multiSend` delegatecall, so without this policy the
 * guard checks that one call and the transfers inside it are never examined. There is nothing
 * to configure: the policy takes no payload and its access is fixed, so the flow is the Safe
 * and a review.
 */
const MultiSendPolicyFlow = () => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { allSafes, isLoading: safesLoading } = useSpaceSafes()
  const safes = useMemo<SafeRowItem[]>(() => flattenSafes(allSafes), [allSafes])

  const preselectedKey = typeof router.query.policySafe === 'string' ? router.query.policySafe.toLowerCase() : ''
  const STEPS = useMemo(() => {
    const steps = [
      { key: 'apply-to', label: 'Select Safe' },
      { key: 'review', label: 'Review' },
    ]

    return preselectedKey ? steps.filter((step) => step.key !== 'apply-to') : steps
  }, [preselectedKey])

  const [stepIndex, setStepIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState(preselectedKey)

  const selectedSafe = useMemo(() => safes.find((s) => safeKey(s) === selectedKey), [safes, selectedKey])
  const chainId = selectedSafe?.chainId ?? ''
  const safeAddress = selectedSafe?.address ?? ''

  const { safePolicyGuard: guardAddress, policyContract } = usePolicyContracts(
    chainId,
    safeAddress,
    PolicyType.MultiSend,
  )
  const multiSendAddress = useMemo(() => (chainId ? getMultiSendAddress(chainId) : undefined), [chainId])
  const hasPolicyContracts = !!guardAddress && !!policyContract && !!multiSendAddress

  const { currentGuard, isUnknownGuard } = usePolicyGuard(chainId, safeAddress, guardAddress)

  const { setTxFlow } = useContext(TxModalContext)
  const dispatch = useAppDispatch()
  const storePolicyRequest = useStorePolicyRequest()

  const replaced = useReplacedPolicies(
    chainId,
    safeAddress,
    useMemo(
      () =>
        multiSendAddress
          ? [
              {
                target: multiSendAddress,
                selector: MULTI_SEND_SELECTOR,
                operation: OPERATION_DELEGATECALL,
                policy: '',
                data: '',
              },
            ]
          : [],
      [multiSendAddress],
    ),
  )

  const step = STEPS[stepIndex].key
  const continueDisabled = step === 'apply-to' ? !selectedSafe : !hasPolicyContracts

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
    if (!selectedSafe || !guardAddress || !policyContract || !multiSendAddress) return

    const { txs, mode, configurations, configureRoot } = buildMultiSendPolicyBatch({
      safeAddress: safeAddress as Address,
      currentGuard: currentGuard as Address | undefined,
      safePolicyGuard: guardAddress as Address,
      policyContract: policyContract as Address,
      multiSendAddress: multiSendAddress as Address,
      allowOverwriteGuard: isUnknownGuard,
    })

    const isRequest = mode === 'request'
    const subtitle = isRequest ? 'Request batched transactions' : 'Batched transactions'

    const saveSnapshot = () => {
      const requestedAt = Math.floor(Date.now() / 1000)
      savePolicyRequestApi.save({
        id: configureRoot,
        chainId,
        safeAddress,
        type: PolicyType.MultiSend,
        enforcement: {
          via: 'guard',
          guards: { transactionGuard: { policyContract, safePolicyGuard: guardAddress } },
        },
        configurations,
        configureRoot,
        requestedAt,
        readyAt: requestedAt + POLICY_GUARD_DELAY_SEC,
        delaySec: POLICY_GUARD_DELAY_SEC,
      })
    }

    if (isRequest) {
      saveSnapshot()

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

    setTxFlow(<PolicyBatchFlow txs={txs} subtitle={subtitle} onSubmit={isRequest ? saveSnapshot : undefined} />)
  }

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
              title="Which Safe does this apply to?"
            />
          )}

          {step === 'review' && (
            <div className="flex flex-col gap-4">
              <Typography variant="h3">Batched transactions</Typography>
              <Typography variant="paragraph-small" className="text-muted-foreground">
                Every call inside a batch will be checked against this Safe&apos;s other policies, not just the batch
                itself.
              </Typography>

              {replaced.length > 0 && <ReplacedPolicyWarning policies={replaced} />}

              {!multiSendAddress && chainId && (
                <Alert variant="warning">
                  <AlertSeverityIcon variant="warning" />
                  <AlertDescription>
                    This chain has no MultiSend deployment, so there is no batch to govern here.
                  </AlertDescription>
                </Alert>
              )}

              {!!chainId && !guardAddress && (
                <Alert variant="warning">
                  <AlertSeverityIcon variant="warning" />
                  <AlertDescription>
                    The policy engine isn&apos;t available on this chain yet, so this policy can&apos;t be configured.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                {selectedSafe && <PolicySummaryRow isFirst label="Safe" value={shortenAddress(selectedSafe.address)} />}
                {multiSendAddress && <PolicySummaryRow label="Batches via" value={shortenAddress(multiSendAddress)} />}
                <PolicySummaryRow label="Applies to" value="Every call inside a batch" />
              </div>
            </div>
          )}
        </>
      }
      summary={null}
    />
  )
}

export default MultiSendPolicyFlow
