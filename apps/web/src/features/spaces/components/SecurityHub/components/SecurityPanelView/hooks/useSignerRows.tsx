import { type ReactNode, useMemo } from 'react'
import type { EvidenceItem, ScanContext, ScanResult, SecurityGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  EvidenceList,
  Row,
  StatusIcon,
  buildExpanded,
  isPassingStatus,
  makeBuildCta,
  sortBySeverity,
  type SectionRow,
} from '../primitives'

type RenderedRow = { key: string; node: ReactNode }

export type UseSignerRowsResult = {
  isReady: boolean
  /** Flagged signers + (if failing) the multichain row, sorted worst-first. */
  failingRows: RenderedRow[]
  /** Signers with `isPassingStatus` results — collapsed under the accordion. */
  passingSigners: RenderedRow[]
  /** Multichain row rendered separately when it passes (it isn't a signer per se). */
  passingMultichainRow: RenderedRow | null
}

const introForSigner = (status: ScanResult['status'], severity: SecurityGrade): string | undefined => {
  if (status === 'inconclusive') return 'Screening service unavailable. Manually verify this signer.'
  if (severity === 'Critical')
    return 'This address appears on a sanctions or block list. Consider replacing this signer.'
  if (status !== 'clear') return 'This address has elevated risk exposure (transactions linked to flagged sources).'
  return undefined
}

/**
 * Builds the rows rendered by `SignersSection` from a Safe's `signer_integrity` and
 * `multichain_setup` results.
 *
 * The multichain row is treated specially: failing ones are bucketed with the flagged
 * signers (so severity ranking applies), but a passing multichain row stays outside the
 * passing-signers accordion since it isn't a signer — it's a property of the signer set.
 */
export const useSignerRows = (
  scanContext: ScanContext,
  results: Record<string, ScanResult>,
  safeQueryParam: string | undefined,
): UseSignerRowsResult => {
  const security = useLoadFeature(SecurityFeature)
  const buildCta = useMemo(
    () => (security.$isReady ? makeBuildCta(security.checkDefs) : null),
    [security.$isReady, security.checkDefs],
  )

  if (!security.$isReady || !buildCta) {
    return { isReady: false, failingRows: [], passingSigners: [], passingMultichainRow: null }
  }

  const signerIntegrityResult = results['signer_integrity']
  const multichainResult = results['multichain_setup']

  // All signer rows route back to the signer_integrity remediation page.
  const signerCta = buildCta('signer_integrity', signerIntegrityResult, safeQueryParam)

  const signerItems: SectionRow[] = scanContext.owners.map((owner) => {
    const severity: SecurityGrade = signerIntegrityResult?.severity ?? 'Low'
    const status: ScanResult['status'] = signerIntegrityResult?.status ?? 'clear'
    const title = owner.name || shortenAddress(owner.value)
    const intro = introForSigner(status, severity)
    const signerEvidence: EvidenceItem[] = [{ label: 'Address', value: owner.value }]
    const rowCta = isPassingStatus(status) ? null : signerCta

    return {
      key: `signer-${owner.value}`,
      severity,
      isPassing: isPassingStatus(status),
      node: (
        <Row
          leadIcon={<StatusIcon status={status} />}
          title={title}
          expandedContent={<EvidenceList intro={intro} evidence={signerEvidence} cta={rowCta} />}
        />
      ),
    }
  })

  let multichainItem: SectionRow | null = null
  if (multichainResult && multichainResult.status !== 'not_applicable') {
    const ok = multichainResult.status === 'clear'
    const title = ok ? 'Signers are consistent across networks' : 'Signers differ across networks'
    const multichainCta = buildCta('multichain_setup', multichainResult, safeQueryParam)
    multichainItem = {
      key: 'multichain',
      severity: multichainResult.severity,
      isPassing: isPassingStatus(multichainResult.status),
      node: (
        <Row
          leadIcon={<StatusIcon status={multichainResult.status} />}
          title={title}
          expandedContent={buildExpanded(multichainResult, multichainCta)}
        />
      ),
    }
  }

  const failingItems = signerItems.filter((i) => !i.isPassing)
  if (multichainItem && !multichainItem.isPassing) failingItems.push(multichainItem)

  const failingRows = sortBySeverity(failingItems).map(({ key, node }) => ({ key, node }))
  const passingSigners = signerItems.filter((i) => i.isPassing).map(({ key, node }) => ({ key, node }))
  const passingMultichainRow =
    multichainItem && multichainItem.isPassing ? { key: multichainItem.key, node: multichainItem.node } : null

  return { isReady: true, failingRows, passingSigners, passingMultichainRow }
}
