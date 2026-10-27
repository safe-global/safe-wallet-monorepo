import { useMemo, type ReactElement } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
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
import {
  decodeConfigurations,
  decodeConfigureRoot,
  decodePolicyPayload,
  isClearedCosigner,
} from '../../../services/policyTx'
import { usePolicyTypeByContract } from './usePolicyTypeByContract'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacePoliciesGetPendingPoliciesV1Query } from '@/store/api/gateway/spacePolicies'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import { ALLOWLIST_POLICY_TYPES, PENDING_POLICY_TYPES } from '../hooks/useSpacePolicies'

/**
 * The configurations CGW stored for a requested root. `requestConfiguration` publishes only the root, and the
 * wallet hands CGW the payload right before proposing it, so any signer can see what the request changes.
 */
const useRequestedConfigurations = (
  chainId: string,
  safeAddress: string,
  root?: string,
): PolicyConfiguration[] | undefined => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData } = useSpacePoliciesGetPendingPoliciesV1Query(
    {
      spaceId: spaceId ?? '',
      types: [...PENDING_POLICY_TYPES, ...ALLOWLIST_POLICY_TYPES],
      safes: [`${chainId}:${safeAddress}`],
    },
    { skip: !root || !isUserSignedIn || !spaceId },
  )

  return useMemo(() => {
    if (!root) return undefined

    for (const dto of currentData ?? []) {
      if (dto.kind === 'delayed-guard-policies' && dto.root.toLowerCase() === root.toLowerCase()) {
        return dto.configurations ?? undefined
      }
    }
    return undefined
  }, [currentData, root])
}

/** What the configuration applies to, in words. */
const AccessValue = ({ configuration }: { configuration: PolicyConfiguration }): ReactElement => {
  if (isFallbackAccessId(accessId(configuration))) {
    return (
      <div className="flex flex-row items-center gap-2">
        <Typography variant="paragraph-small">Any transaction</Typography>
        <FallbackBadge />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {generateDataRowValue(configuration.target, 'address', true)}
      <Typography variant="paragraph-small" className="font-mono text-muted-foreground">
        {configuration.selector}
        {configuration.operation === OPERATION_DELEGATECALL ? ' · delegate call' : ''}
      </Typography>
    </div>
  )
}

/** The configuration's `data`, decoded as the policy defines it. */
const PayloadRows = ({
  configuration,
  policyType,
}: {
  configuration: PolicyConfiguration
  policyType?: string
}): ReactElement | null => {
  const payload = decodePolicyPayload(configuration.data, policyType as never)

  if (payload.kind === 'recipients') {
    const allowed = payload.recipients.filter((recipient) => recipient.allowed)
    const removed = payload.recipients.filter((recipient) => !recipient.allowed)

    return (
      <>
        {allowed.length > 0 && (
          <TxDataRow title="Allowed recipients">
            <div className="flex flex-col gap-1">
              {allowed.map((r) => generateDataRowValue(r.address, 'address', true))}
            </div>
          </TxDataRow>
        )}
        {removed.length > 0 && (
          <TxDataRow title="Removed recipients">
            <div className="flex flex-col gap-1">
              {removed.map((r) => generateDataRowValue(r.address, 'address', true))}
            </div>
          </TxDataRow>
        )}
      </>
    )
  }

  if (payload.kind === 'cosigner') {
    return (
      <TxDataRow title="Cosigner address">
        {isClearedCosigner(payload) ? (
          <Typography variant="paragraph-small">Cleared — no cosigner required</Typography>
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
  configuration: PolicyConfiguration
  index: number
  total: number
  policyType?: string
}): ReactElement => (
  <div className="flex flex-col gap-1.5">
    {total > 1 && (
      <Typography variant="paragraph-small-bold">
        Rule {index + 1} of {total}
      </Typography>
    )}

    <TxDataRow title="Policy">
      {policyType ? (
        <div className="flex flex-row items-center gap-2">
          <Typography variant="paragraph-small-medium">{labelOf(policyType as never)}</Typography>
          <Typography variant="paragraph-small" className="text-muted-foreground">
            {shortenAddress(configuration.policy)}
          </Typography>
        </div>
      ) : (
        generateDataRowValue(configuration.policy, 'address', true)
      )}
    </TxDataRow>

    <TxDataRow title="Applies to">
      <AccessValue configuration={configuration} />
    </TxDataRow>

    <PayloadRows configuration={configuration} policyType={policyType} />
  </div>
)

export const PolicyConfigurationList = ({
  configurations,
  typeByContract,
}: {
  configurations: PolicyConfiguration[]
  /** Policy contract → type, resolved by the caller so this stays a pure renderer. */
  typeByContract: Map<string, PolicyType>
}): ReactElement => {
  return (
    <div className="flex flex-col gap-4">
      {configurations.map((configuration, index) => (
        <ConfigurationDetails
          key={`${configuration.target}-${configuration.selector}-${index}`}
          configuration={configuration}
          index={index}
          total={configurations.length}
          policyType={typeByContract.get(configuration.policy.toLowerCase())}
        />
      ))}
    </div>
  )
}

/**
 * Policy details for a SafePolicyGuard transaction.
 *
 * `configureImmediately` and `applyConfiguration` carry the `Configuration[]` in their
 * calldata, so it is decoded and rendered per policy. `requestConfiguration` publishes only a
 * root, so the configurations CGW stored for it are matched on that root; without them, the root is all there
 * is to show.
 *
 * Returns null when the calldata isn't one of those methods, so the caller can fall back to
 * the generic parameter view.
 */
export const PolicyTxDetails = ({ txData }: { txData: TransactionDetails['txData'] }): ReactElement | null => {
  const { safe, safeAddress } = useSafeInfo()
  const typeByContract = usePolicyTypeByContract(safe.chainId, safeAddress)

  const configurations = decodeConfigurations(txData?.hexData)
  const root = configurations ? undefined : decodeConfigureRoot(txData?.hexData)
  const requested = useRequestedConfigurations(safe.chainId, safeAddress, root)

  if (configurations) {
    return <PolicyConfigurationList configurations={configurations} typeByContract={typeByContract} />
  }

  if (!root) return null

  return (
    <div className="flex flex-col gap-4">
      <TxDataRow title="Configuration root">{generateDataRowValue(root, 'hash', true)}</TxDataRow>

      {requested ? (
        <>
          <Typography variant="paragraph-small" className="text-muted-foreground">
            The change this root commits to:
          </Typography>
          <PolicyConfigurationList configurations={requested} typeByContract={typeByContract} />
        </>
      ) : (
        <Typography variant="paragraph-small" className="text-muted-foreground">
          Only the root is published on-chain. The policies it commits to are shown when the change is applied.
        </Typography>
      )}
    </div>
  )
}

export default PolicyTxDetails
