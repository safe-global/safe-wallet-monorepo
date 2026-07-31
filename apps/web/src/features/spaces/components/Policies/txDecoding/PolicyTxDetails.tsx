import { useMemo, type ReactElement } from 'react'
import { Stack, Typography } from '@mui/material'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { PolicyType } from '@safe-global/store/gateway/policies/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { PolicyConfiguration } from '../shared/guardTx'
import { isFallbackAccessId } from '../shared/accessSelector'
import { accessId, OPERATION_DELEGATECALL } from '../shared/accessSelector'
import { labelOf } from '../policyLabels'
import { FallbackBadge } from '../shared/FallbackBadge'
import { usePolicyRequests } from '../policyRequestStore'
import {
  decodeConfigurations,
  decodeConfigureRoot,
  decodePolicyPayload,
  isClearedCosigner,
} from '../../../services/policyTx'
import { usePolicyTypeByContract } from './usePolicyTypeByContract'
import { usePendingPolicies } from '../hooks/usePendingPolicies'
import { toConfigurations } from '../shared/applyPlan'

/** A configuration to render, and whether its payload is actually known. */
type RenderableConfiguration = PolicyConfiguration & { payloadKnown?: boolean }

/**
 * What the space recorded for a requested root.
 *
 * `requestConfiguration` publishes only the root, so a signer who didn't make the request has
 * nothing locally. CGW does: its pending entry carries the bindings — which policy, on which
 * access — and, once it serves them, the payloads too. `payloadKnown` keeps "no payload" (an
 * Allow policy) distinct from "payload not served yet".
 */
const usePendingBindings = (
  chainId: string,
  safeAddress: string,
  root?: string,
): RenderableConfiguration[] | undefined => {
  const { policies: pending } = usePendingPolicies(chainId, safeAddress)

  return useMemo(() => {
    if (!root) return undefined

    const item = pending.find((entry) => entry.configureRoot.toLowerCase() === root.toLowerCase())
    if (!item?.policies?.length) return undefined

    return item.policies.map((binding) => ({
      ...toConfigurations([binding])[0],
      payloadKnown: binding.data != null,
    }))
  }, [pending, root])
}

/** What the configuration applies to, in words. */
const AccessValue = ({ configuration }: { configuration: PolicyConfiguration }): ReactElement => {
  if (isFallbackAccessId(accessId(configuration))) {
    return (
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="body2">Any transaction</Typography>
        <FallbackBadge />
      </Stack>
    )
  }

  return (
    <Stack gap={0.5}>
      {generateDataRowValue(configuration.target, 'address', true)}
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'ui-monospace, monospace' }}>
        {configuration.selector}
        {configuration.operation === OPERATION_DELEGATECALL ? ' · delegate call' : ''}
      </Typography>
    </Stack>
  )
}

/** The configuration's `data`, decoded as the policy defines it. */
const PayloadRows = ({
  configuration,
  policyType,
}: {
  configuration: RenderableConfiguration
  policyType?: string
}): ReactElement | null => {
  if (configuration.payloadKnown === false) {
    return (
      <TxDataRow title="Policy data">
        <Typography variant="body2" color="text.secondary">
          Not available — it is published when the change is applied.
        </Typography>
      </TxDataRow>
    )
  }

  const payload = decodePolicyPayload(configuration.data, policyType as never)

  if (payload.kind === 'recipients') {
    const allowed = payload.recipients.filter((recipient) => recipient.allowed)
    const removed = payload.recipients.filter((recipient) => !recipient.allowed)

    return (
      <>
        {allowed.length > 0 && (
          <TxDataRow title="Allowed recipients">
            <Stack gap={0.5}>{allowed.map((r) => generateDataRowValue(r.address, 'address', true))}</Stack>
          </TxDataRow>
        )}
        {removed.length > 0 && (
          <TxDataRow title="Removed recipients">
            <Stack gap={0.5}>{removed.map((r) => generateDataRowValue(r.address, 'address', true))}</Stack>
          </TxDataRow>
        )}
      </>
    )
  }

  if (payload.kind === 'cosigner') {
    return (
      <TxDataRow title="Cosigner address">
        {isClearedCosigner(payload) ? (
          <Typography variant="body2">Cleared — no cosigner required</Typography>
        ) : (
          generateDataRowValue(payload.cosigner, 'address', true)
        )}
      </TxDataRow>
    )
  }

  if (payload.kind === 'raw') {
    return <TxDataRow title="Policy data">{generateDataRowValue(payload.data, 'rawData')}</TxDataRow>
  }

  // 'none' — Allow, Deny and native transfers take no payload, so there's nothing to add.
  return null
}

const ConfigurationDetails = ({
  configuration,
  index,
  total,
  policyType,
}: {
  configuration: RenderableConfiguration
  index: number
  total: number
  policyType?: string
}): ReactElement => (
  <Stack gap={0.75}>
    {total > 1 && (
      <Typography variant="body2" fontWeight={700}>
        Rule {index + 1} of {total}
      </Typography>
    )}

    <TxDataRow title="Policy">
      {policyType ? (
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="body2" fontWeight={600}>
            {labelOf(policyType as never)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {shortenAddress(configuration.policy)}
          </Typography>
        </Stack>
      ) : (
        generateDataRowValue(configuration.policy, 'address', true)
      )}
    </TxDataRow>

    <TxDataRow title="Applies to">
      <AccessValue configuration={configuration} />
    </TxDataRow>

    <PayloadRows configuration={configuration} policyType={policyType} />
  </Stack>
)

export const PolicyConfigurationList = ({
  configurations,
  typeByContract,
}: {
  configurations: RenderableConfiguration[]
  /** Policy contract → type, resolved by the caller so this stays a pure renderer. */
  typeByContract: Map<string, PolicyType>
}): ReactElement => {
  return (
    <Stack gap={2}>
      {configurations.map((configuration, index) => (
        <ConfigurationDetails
          key={`${configuration.target}-${configuration.selector}-${index}`}
          configuration={configuration}
          index={index}
          total={configurations.length}
          policyType={typeByContract.get(configuration.policy.toLowerCase())}
        />
      ))}
    </Stack>
  )
}

/**
 * Policy details for a SafePolicyGuard transaction.
 *
 * `configureImmediately` and `applyConfiguration` carry the `Configuration[]` in their
 * calldata, so it is decoded and rendered per policy. `requestConfiguration` publishes only a
 * root — the payload behind it lives with whoever requested it, so the local snapshot is
 * matched on that root; without it, the root is all there is to show.
 *
 * Returns null when the calldata isn't one of those methods, so the caller can fall back to
 * the generic parameter view.
 */
export const PolicyTxDetails = ({ txData }: { txData: TransactionDetails['txData'] }): ReactElement | null => {
  const { safe, safeAddress } = useSafeInfo()
  const { requests } = usePolicyRequests(safe.chainId, safeAddress)
  const typeByContract = usePolicyTypeByContract(safe.chainId, safeAddress)

  const configurations = decodeConfigurations(txData?.hexData)
  const root = configurations ? undefined : decodeConfigureRoot(txData?.hexData)
  const requested = root
    ? requests.find((request) => request.configureRoot.toLowerCase() === root.toLowerCase())
    : undefined
  const bindings = usePendingBindings(safe.chainId, safeAddress, requested ? undefined : root)

  if (configurations) {
    return <PolicyConfigurationList configurations={configurations} typeByContract={typeByContract} />
  }

  if (!root) return null

  return (
    <Stack gap={2}>
      <TxDataRow title="Configuration root">{generateDataRowValue(root, 'hash', true)}</TxDataRow>

      {requested ? (
        <>
          <Typography variant="body2" color="text.secondary">
            The change this root commits to:
          </Typography>
          <PolicyConfigurationList configurations={requested.configurations} typeByContract={typeByContract} />
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            Only the root is published on-chain. The policies it commits to are shown when the change is applied.
          </Typography>

          {bindings && <PolicyConfigurationList configurations={bindings} typeByContract={typeByContract} />}
        </>
      )}
    </Stack>
  )
}

export default PolicyTxDetails
