import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { ScanResult } from '@/features/security/types'
import {
  SeverityIcon,
  type SeverityTone,
} from '@views/features/spaces/components/SecurityHub/components/SeverityIcon/SeverityIcon'
import {
  VULNERABLE_MODULE_INTRO,
  ZODIAC_VULNERABILITY_CTA,
  getModuleRowContent,
} from '@views/features/spaces/components/SecurityHub/components/SecurityChecks/utils'
import {
  EvidenceListView,
  Row,
  buildExpandedView,
  isPassingStatus,
  type Cta,
  type ViewEvidenceItem,
} from './PrimitivesView'

export type SecurityCheckKind =
  | 'threshold'
  | 'multichain'
  | 'recovery'
  | 'version'
  | 'factory'
  | 'guard'
  | 'fallback'
  | 'modules-empty'
  | 'scanning'
  | 'pending'

export type SecurityCheckRowSpec =
  | {
      kind: 'check'
      check: SecurityCheckKind
      result: ScanResult
      /** `result.evidence` with each address value flagged. */
      evidence?: ViewEvidenceItem[]
      tone: SeverityTone
      cta: Cta | null
      /** Replaces `cta` with the Hypernative signup action (partner-tagged guard nudge). */
      hnSignup?: { labelOverride?: string; onClick: () => void }
      threshold?: number
      hasGuard?: boolean
      hasFallback?: boolean
      queuedTxCount?: number
    }
  | { kind: 'modulesSummary'; tone: SeverityTone; count: number; onViewAll: () => void }
  | { kind: 'vulnerableNested'; tone: SeverityTone }
  | {
      kind: 'module'
      tone: SeverityTone
      address: string
      name?: string
      addressIsAddress: boolean
      nameIsAddress: boolean
      vulnerable: boolean
      trusted: boolean
      modulesCta: Cta | null
    }

type CheckSpec = Extract<SecurityCheckRowSpec, { kind: 'check' }>

const checkTitle = (spec: CheckSpec): string => {
  const { result } = spec
  const ok = isPassingStatus(result.status)
  switch (spec.check) {
    case 'threshold':
      return ok
        ? 'Signing threshold is strong'
        : spec.threshold === 1
          ? 'Single signer controls this Safe'
          : 'Signing threshold is low'
    case 'multichain':
      return ok ? 'Signers are consistent across networks' : 'Signers differ across networks'
    case 'recovery':
      return result.status === 'clear'
        ? 'Recovery is configured'
        : result.status === 'not_applicable'
          ? 'Recovery not available on this network'
          : 'Recovery is not configured'
    case 'version':
      return ok ? 'Contract version is up to date' : 'Contract version is outdated'
    case 'factory':
      return result.status === 'clear'
        ? 'Deployed via official Safe factory'
        : result.status === 'inconclusive'
          ? 'Deployment origin not yet verified'
          : 'Deployed from an unrecognized source'
    case 'guard':
      return ok
        ? spec.hasGuard
          ? 'Transaction guard is active'
          : 'No unsupported guard installed'
        : spec.hasGuard
          ? 'Transaction guard is unverified'
          : 'Transaction guard is recommended'
    case 'fallback': {
      // Scanner emits a human label like "Official Safe fallback handler" / "CoW Protocol TWAP handler"
      // in evidence — reuse it directly so the title auto-matches each variant.
      const handlerLabel = result.evidence?.find(
        (e): e is { label: string; value: string } => typeof e !== 'string' && e.label === 'Status',
      )?.value
      return ok
        ? spec.hasFallback
          ? handlerLabel || 'Fallback handler is active'
          : 'No fallback handler in use'
        : 'Fallback handler is unverified'
    }
    case 'modules-empty':
      return 'No unsupported module installed'
    case 'scanning':
      return ok ? 'Transaction scanning is enabled' : 'Transaction scanning is disabled'
    case 'pending':
      return ok
        ? (spec.queuedTxCount ?? 0) > 0
          ? 'Queue is up to date'
          : 'No pending transactions'
        : 'Pending transactions are stale'
  }
}

export const SecurityCheckRowView = ({ spec }: { spec: SecurityCheckRowSpec }): ReactElement => {
  if (spec.kind === 'modulesSummary') {
    // Collapsed summary row — not expandable, acts as a gateway to per-module rows.
    return (
      <Row
        leadIcon={<SeverityIcon tone={spec.tone} />}
        accentTone={spec.tone}
        title={`Modules & Extensions · ${spec.count} installed`}
        trailing={
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              spec.onViewAll()
            }}
            // eslint-disable-next-line no-restricted-syntax -- inline text toggle: auto-height, no padding
            className="h-auto min-w-0 p-0 text-[0.7rem] font-semibold normal-case"
          >
            View all
          </Button>
        }
      />
    )
  }

  if (spec.kind === 'vulnerableNested') {
    return (
      <Row
        leadIcon={<SeverityIcon tone={spec.tone} />}
        accentTone={spec.tone}
        title="Vulnerable module detected"
        expandedContent={<EvidenceListView intro={VULNERABLE_MODULE_INTRO} cta={ZODIAC_VULNERABILITY_CTA} />}
      />
    )
  }

  if (spec.kind === 'module') {
    const { name, address, vulnerable, trusted } = spec
    // Identify which module each row is so multiple flagged modules aren't indistinguishable.
    const title = vulnerable
      ? `Vulnerable module · ${name || shortenAddress(address)}`
      : trusted
        ? `Recognized module · ${name || shortenAddress(address)}`
        : 'Unrecognized module detected'
    const perModuleEvidence: ViewEvidenceItem[] = [
      { label: 'Address', value: address, isAddress: spec.addressIsAddress },
      ...(name ? [{ label: 'Name', value: name, isAddress: spec.nameIsAddress }] : []),
    ]
    const { intro, cta } = getModuleRowContent({ vulnerable, trusted }, spec.modulesCta)
    return (
      <Row
        leadIcon={<SeverityIcon tone={spec.tone} />}
        accentTone={spec.tone}
        title={title}
        expandedContent={<EvidenceListView intro={intro} evidence={perModuleEvidence} cta={cta} />}
      />
    )
  }

  const { result } = spec
  const cta = spec.hnSignup
    ? { label: spec.hnSignup.labelOverride || 'Set up protection', onClick: spec.hnSignup.onClick }
    : spec.cta
  // Surface the remediation as the row subtitle for failing checks (passing rows need no action).
  const subtitle = !isPassingStatus(result.status) && result.remediation ? result.remediation : undefined

  return (
    <Row
      leadIcon={<SeverityIcon tone={spec.tone} />}
      accentTone={spec.tone}
      subtitle={subtitle}
      title={checkTitle(spec)}
      expandedContent={buildExpandedView(true, spec.evidence, cta)}
    />
  )
}
