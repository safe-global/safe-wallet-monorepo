import type { ReactElement, ReactNode } from 'react'
import { isAddress } from 'ethers'
import type { EvidenceItem, ScanResult, SecurityGrade } from '@/features/security/types'
import { SEVERITY_RANK, type SecurityContract } from '@/features/security'
import { withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
import {
  EvidenceListView,
  isPassingStatus,
  type Cta,
  type ViewEvidenceItem,
} from '@views/features/spaces/components/SecurityHub/components/SecurityChecks/PrimitivesView'

export {
  isPassingStatus,
  Row,
  StatusIcon,
} from '@views/features/spaces/components/SecurityHub/components/SecurityChecks/PrimitivesView'
export type { Cta }

export type SectionRow = { key: string; severity: SecurityGrade; isPassing: boolean; node: ReactNode }

/** Sort row entries with most severe first, falling back to original order. */
export const sortBySeverity = <T extends { severity: SecurityGrade }>(items: T[]): T[] =>
  [...items].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

/** Marks each evidence value that is an address, so the view can shorten it and offer a copy button. */
export const annotateEvidence = (evidence: EvidenceItem[] | undefined): ViewEvidenceItem[] | undefined =>
  evidence?.map((item) => (typeof item === 'string' ? item : { ...item, isAddress: isAddress(item.value) }))

/**
 * Factory that binds `checkDefs` to a CTA builder. Consumers obtain `checkDefs`
 * via useLoadFeature and pass it once; the returned function is then used at
 * each render site.
 *
 * The returned CTA builder returns null when:
 *  - the row is passing (no action needed),
 *  - we don't yet have a `safeQueryParam` (chain metadata still loading), or
 *  - there's no checkDefs entry for this check id.
 * Label precedence: `ScanResult.ctaLabelOverride` → `checkDefs[id].ctaLabel`.
 */
export const makeBuildCta =
  (checkDefs: SecurityContract['checkDefs'], spaceId: string | null) =>
  (checkId: string, result: ScanResult | undefined, safeQueryParam: string | undefined): Cta | null => {
    if (!safeQueryParam) return null
    const def = checkDefs[checkId]
    if (!def) return null
    if (result && isPassingStatus(result.status)) return null
    const label = result?.ctaLabelOverride || def.ctaLabel
    return {
      label,
      href: withSpaceIdInUrl(`${def.fixRoute}?safe=${encodeURIComponent(safeQueryParam)}`, spaceId),
    }
  }

/** Expanded-row body: optional intro paragraph + evidence key/value list + optional CTA. */
export const EvidenceList = ({
  intro,
  evidence,
  cta,
}: {
  intro?: ReactNode
  evidence?: EvidenceItem[]
  cta?: Cta | null
}): ReactElement | null => <EvidenceListView intro={intro} evidence={annotateEvidence(evidence)} cta={cta} />

/**
 * Build expanded body for a row backed by a ScanResult. Returns undefined when there's nothing to show.
 * The remediation summary is surfaced in the row's subtitle (see `Row`), so the expanded body
 * carries only the evidence list and CTA.
 */
export const buildExpanded = (result: ScanResult | undefined, cta?: Cta | null): ReactNode => {
  if (!result) return cta ? <EvidenceList cta={cta} /> : undefined
  const hasEvidence = result.evidence && result.evidence.length > 0
  if (!hasEvidence && !cta) return undefined
  return <EvidenceList evidence={result.evidence} cta={cta} />
}
