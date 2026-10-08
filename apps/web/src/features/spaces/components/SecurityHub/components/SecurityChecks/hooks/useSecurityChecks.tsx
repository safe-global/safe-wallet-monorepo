import { type ReactNode, useMemo, useState } from 'react'
import { isAddress } from 'ethers'
import type { SafeGrade, ScanContext, ScanResult, SecurityGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import {
  annotateEvidence,
  isPassingStatus,
  makeBuildCta,
  sortBySeverity,
  type Cta,
  type SectionRow,
} from '../primitives'
import {
  GRADE_TONE,
  resolveStatusTone,
  type SeverityTone,
} from '@views/features/spaces/components/SecurityHub/components/SeverityIcon/SeverityIcon'
import {
  SecurityCheckRowView,
  type SecurityCheckKind,
} from '@views/features/spaces/components/SecurityHub/components/SecurityChecks/SecurityCheckRowView'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'

export type FailingRow = { key: string; node: ReactNode; grade: SafeGrade }

export type UseSecurityChecksResult = {
  isReady: boolean
  failingRows: FailingRow[]
  passingRows: { key: string; node: ReactNode }[]
}

/** Maps a per-check severity to the SafeGrade used by the issue chips. */
const SEVERITY_TO_SAFE_GRADE: Record<SecurityGrade, SafeGrade> = {
  Critical: 'critical',
  High: 'at_risk',
  Medium: 'needs_attention',
  Low: 'needs_attention',
}

/** Accent-bar + icon colour per grade, matching the SafeGrade chip's text colour. */
const GRADE_ROW_COLOR: Record<SafeGrade, string> = {
  critical: 'error.main',
  at_risk: 'warning.main',
  needs_attention: 'review.main',
  passing: 'success.main',
}

/**
 * Tone for a check row's accent bar + leading icon. Failing rows take their grade group's
 * colour (so the bar/icon match the section chip); passing / N-A / inconclusive rows keep
 * their neutral status tone. `needs_attention` rows also swap their per-status glyph for
 * the grade's info icon — so a partial Medium check reads as info, not a warning triangle.
 */
const rowTone = (status: ScanResult['status'], severity: SecurityGrade): SeverityTone => {
  const base = resolveStatusTone(status, severity)
  if (isPassingStatus(status)) return base
  const grade = SEVERITY_TO_SAFE_GRADE[severity]
  const Icon = grade === 'needs_attention' ? GRADE_TONE.needs_attention.Icon : base.Icon
  return { Icon, color: GRADE_ROW_COLOR[grade] }
}

/**
 * Derives the rows rendered by `SecurityChecksSection` from raw scan results.
 *
 * Owns the `modulesExpanded` UI state because it directly affects which rows
 * are produced (collapsed summary vs. one row per module). The footer's
 * `passingExpanded` state stays in the rendering component since it only
 * toggles visibility of an already-built list.
 */
export const useSecurityChecks = (
  scanContext: ScanContext,
  results: Record<string, ScanResult>,
  safeQueryParam: string | undefined,
  /** Opens the Hypernative signup flow for a partner-tagged guard nudge (drawer-provided). */
  onHnSignupClick?: () => void,
): UseSecurityChecksResult => {
  const security = useLoadFeature(SecurityFeature)
  const [modulesExpanded, setModulesExpanded] = useState(false)
  const spaceId = useUrlSpaceId()

  const buildCta = useMemo(
    () => (security.$isReady ? makeBuildCta(security.checkDefs, spaceId) : null),
    [security.$isReady, security.checkDefs, spaceId],
  )

  const isKnownModuleByName = security.$isReady ? security.isKnownModuleByName : null
  const zeroAddress = security.$isReady ? security.zeroAddress : null

  const { failingRows, passingRows } = useMemo(() => {
    if (!buildCta || !isKnownModuleByName || !zeroAddress) {
      return {
        failingRows: [] as FailingRow[],
        passingRows: [] as { key: string; node: ReactNode }[],
      }
    }

    const hasGuard = scanContext.guard !== null && scanContext.guard.value !== zeroAddress
    const hasFallback = scanContext.fallbackHandler !== null && scanContext.fallbackHandler.value !== zeroAddress
    const activeModules = (scanContext.modules ?? [])
      .filter((m) => m.value !== zeroAddress)
      // Defensive de-dupe: never render the same module address twice.
      .filter((m, i, arr) => arr.findIndex((o) => o.value.toLowerCase() === m.value.toLowerCase()) === i)
    // The Safe is affected by a known Zodiac vulnerability when the modules scanner sets
    // `vulnerableModules` (an empty array still means "affected" — see the nested case below).
    const vulnerableModules = results['modules']?.vulnerableModules
    const isVulnerable = Array.isArray(vulnerableModules)
    const vulnerableSet = new Set(vulnerableModules ?? [])
    // Never collapse into a summary when affected — the vulnerable row + remove CTA must stay visible.
    const showModuleSummary = activeModules.length > 2 && !modulesExpanded && !isVulnerable

    const items: SectionRow[] = []
    const checkRow = (
      key: string,
      check: SecurityCheckKind,
      result: ScanResult,
      cta: Cta | null,
      extra: { hnSignup?: { labelOverride?: string; onClick: () => void } } = {},
    ): SectionRow => ({
      key,
      severity: result.severity,
      isPassing: isPassingStatus(result.status),
      node: (
        <SecurityCheckRowView
          spec={{
            kind: 'check',
            check,
            result,
            evidence: annotateEvidence(result.evidence),
            tone: rowTone(result.status, result.severity),
            cta,
            hnSignup: extra.hnSignup,
            threshold: scanContext.threshold,
            hasGuard,
            hasFallback,
            queuedTxCount: scanContext.queuedTxCount,
          }}
        />
      ),
    })

    const accountSetupResult = results['account_setup']
    if (accountSetupResult) {
      items.push(
        checkRow(
          'threshold',
          'threshold',
          accountSetupResult,
          buildCta('account_setup', accountSetupResult, safeQueryParam),
        ),
      )
    }

    const multichainResult = results['multichain_setup']
    if (multichainResult && multichainResult.status !== 'not_applicable') {
      items.push(
        checkRow(
          'multichain',
          'multichain',
          multichainResult,
          buildCta('multichain_setup', multichainResult, safeQueryParam),
        ),
      )
    }

    const recoveryResult = results['recovery']
    if (recoveryResult) {
      items.push(checkRow('recovery', 'recovery', recoveryResult, buildCta('recovery', recoveryResult, safeQueryParam)))
    }

    const versionResult = results['contract_version']
    if (versionResult) {
      items.push(
        checkRow('version', 'version', versionResult, buildCta('contract_version', versionResult, safeQueryParam)),
      )
    }

    const factoryResult = results['factory_validation']
    if (factoryResult) {
      items.push(
        checkRow('factory', 'factory', factoryResult, buildCta('factory_validation', factoryResult, safeQueryParam)),
      )
    }

    const guardResult = results['guard']
    if (guardResult) {
      const ok = isPassingStatus(guardResult.status)
      // A partner-tagged, actionable guard result opens the Hypernative signup flow in place of a
      // deep-link. Passing results already get no CTA (buildCta returns null), so this only fires
      // for the Tier-3 nudge (no guard, high-value, Hypernative chain).
      const isHnNudge = !ok && guardResult.partner === 'hypernative' && onHnSignupClick
      items.push(
        checkRow(
          'guard',
          'guard',
          guardResult,
          isHnNudge ? null : buildCta('guard', guardResult, safeQueryParam),
          isHnNudge ? { hnSignup: { labelOverride: guardResult.ctaLabelOverride, onClick: isHnNudge } } : {},
        ),
      )
    }

    const fallbackResult = results['fallback_handler']
    if (fallbackResult) {
      items.push(
        checkRow('fallback', 'fallback', fallbackResult, buildCta('fallback_handler', fallbackResult, safeQueryParam)),
      )
    }

    const modulesResult = results['modules']
    if (modulesResult) {
      if (activeModules.length === 0) {
        items.push(
          checkRow('modules-empty', 'modules-empty', modulesResult, buildCta('modules', modulesResult, safeQueryParam)),
        )
      } else if (showModuleSummary) {
        items.push({
          key: 'modules-summary',
          severity: modulesResult.severity,
          isPassing: isPassingStatus(modulesResult.status),
          node: (
            <SecurityCheckRowView
              spec={{
                kind: 'modulesSummary',
                tone: rowTone(modulesResult.status, modulesResult.severity),
                count: activeModules.length,
                onViewAll: () => setModulesExpanded(true),
              }}
            />
          ),
        })
      } else {
        const modulesCta = buildCta('modules', modulesResult, safeQueryParam)
        // Affected but no removable module on this Safe (implicated via a related Safe) — surface a
        // single Critical warning instead of per-module rows that would have no remove target.
        if (isVulnerable && vulnerableSet.size === 0) {
          const severity: SecurityGrade = 'Critical'
          items.push({
            key: 'modules-vulnerable-nested',
            severity,
            isPassing: false,
            node: <SecurityCheckRowView spec={{ kind: 'vulnerableNested', tone: rowTone('issue', severity) }} />,
          })
        }
        activeModules.forEach((mod) => {
          const vulnerable = vulnerableSet.has(mod.value)
          const trusted = !vulnerable && isKnownModuleByName(mod.name)
          const severity: SecurityGrade = vulnerable ? 'Critical' : trusted ? 'Low' : 'High'
          const status: ScanResult['status'] = trusted ? 'clear' : 'issue'
          items.push({
            key: `module-${mod.value}`,
            severity,
            isPassing: trusted,
            node: (
              <SecurityCheckRowView
                spec={{
                  kind: 'module',
                  tone: rowTone(status, severity),
                  address: mod.value,
                  name: mod.name ?? undefined,
                  addressIsAddress: isAddress(mod.value),
                  nameIsAddress: Boolean(mod.name) && isAddress(mod.name ?? ''),
                  vulnerable,
                  trusted,
                  modulesCta,
                }}
              />
            ),
          })
        })
      }
    }

    const scanningResult = results['transaction_scanning']
    if (scanningResult) {
      items.push(
        checkRow(
          'scanning',
          'scanning',
          scanningResult,
          buildCta('transaction_scanning', scanningResult, safeQueryParam),
        ),
      )
    }

    const pendingResult = results['pending_tx']
    if (pendingResult) {
      items.push(checkRow('pending', 'pending', pendingResult, buildCta('pending_tx', pendingResult, safeQueryParam)))
    }

    return {
      failingRows: sortBySeverity(items.filter((i) => !i.isPassing)).map(({ key, node, severity }) => ({
        key,
        node,
        grade: SEVERITY_TO_SAFE_GRADE[severity],
      })),
      passingRows: items.filter((i) => i.isPassing).map(({ key, node }) => ({ key, node })),
    }
  }, [
    buildCta,
    isKnownModuleByName,
    zeroAddress,
    scanContext,
    results,
    safeQueryParam,
    modulesExpanded,
    onHnSignupClick,
  ])

  if (!security.$isReady || !buildCta) {
    return { isReady: false, failingRows: [], passingRows: [] }
  }

  return { isReady: true, failingRows, passingRows }
}
