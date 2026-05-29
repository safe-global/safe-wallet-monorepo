import { type ReactNode, useMemo, useState } from 'react'
import { Button } from '@mui/material'
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

export type UseSecurityChecksResult = {
  isReady: boolean
  failingRows: { key: string; node: ReactNode }[]
  passingRows: { key: string; node: ReactNode }[]
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
): UseSecurityChecksResult => {
  const security = useLoadFeature(SecurityFeature)
  const [modulesExpanded, setModulesExpanded] = useState(false)

  const buildCta = useMemo(
    () => (security.$isReady ? makeBuildCta(security.checkDefs) : null),
    [security.$isReady, security.checkDefs],
  )

  const isKnownModuleByName = security.$isReady ? security.isKnownModuleByName : null
  const zeroAddress = security.$isReady ? security.zeroAddress : null

  const { failingRows, passingRows } = useMemo(() => {
    if (!buildCta || !isKnownModuleByName || !zeroAddress) {
      return {
        failingRows: [] as { key: string; node: ReactNode }[],
        passingRows: [] as { key: string; node: ReactNode }[],
      }
    }

    const hasGuard = scanContext.guard !== null && scanContext.guard.value !== zeroAddress
    const hasFallback = scanContext.fallbackHandler !== null && scanContext.fallbackHandler.value !== zeroAddress
    const activeModules = (scanContext.modules ?? []).filter((m) => m.value !== zeroAddress)
    const showModuleSummary = activeModules.length > 2 && !modulesExpanded

    const items: SectionRow[] = []
    const iconFor = (r: ScanResult) => <StatusIcon status={r.status} />

    const accountSetupResult = results['account_setup']
    if (accountSetupResult) {
      const ok = isPassingStatus(accountSetupResult.status)
      const title = ok
        ? 'Signing threshold is strong'
        : scanContext.threshold === 1
          ? 'Single signer controls this Safe'
          : 'Signing threshold is low'
      items.push({
        key: 'threshold',
        severity: accountSetupResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(accountSetupResult)}
            title={title}
            expandedContent={buildExpanded(
              accountSetupResult,
              buildCta('account_setup', accountSetupResult, safeQueryParam),
            )}
          />
        ),
      })
    }

    const multichainResult = results['multichain_setup']
    if (multichainResult && multichainResult.status !== 'not_applicable') {
      const ok = isPassingStatus(multichainResult.status)
      const title = ok ? 'Signers are consistent across networks' : 'Signers differ across networks'
      items.push({
        key: 'multichain',
        severity: multichainResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(multichainResult)}
            title={title}
            expandedContent={buildExpanded(
              multichainResult,
              buildCta('multichain_setup', multichainResult, safeQueryParam),
            )}
          />
        ),
      })
    }

    const recoveryResult = results['recovery']
    if (recoveryResult) {
      const ok = isPassingStatus(recoveryResult.status)
      const title =
        recoveryResult.status === 'clear'
          ? 'Recovery is configured'
          : recoveryResult.status === 'not_applicable'
            ? 'Recovery not available on this network'
            : 'Recovery is not configured'
      items.push({
        key: 'recovery',
        severity: recoveryResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(recoveryResult)}
            title={title}
            expandedContent={buildExpanded(recoveryResult, buildCta('recovery', recoveryResult, safeQueryParam))}
          />
        ),
      })
    }

    const versionResult = results['contract_version']
    if (versionResult) {
      const ok = isPassingStatus(versionResult.status)
      const title = ok ? 'Contract version is up to date' : 'Contract version is outdated'
      items.push({
        key: 'version',
        severity: versionResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(versionResult)}
            title={title}
            expandedContent={buildExpanded(versionResult, buildCta('contract_version', versionResult, safeQueryParam))}
          />
        ),
      })
    }

    const factoryResult = results['factory_validation']
    if (factoryResult) {
      const ok = isPassingStatus(factoryResult.status)
      const title =
        factoryResult.status === 'clear'
          ? 'Deployed via official Safe factory'
          : factoryResult.status === 'inconclusive'
            ? 'Deployment origin not yet verified'
            : 'Deployed from an unrecognized source'
      items.push({
        key: 'factory',
        severity: factoryResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(factoryResult)}
            title={title}
            expandedContent={buildExpanded(
              factoryResult,
              buildCta('factory_validation', factoryResult, safeQueryParam),
            )}
          />
        ),
      })
    }

    const guardResult = results['guard']
    if (guardResult) {
      const ok = isPassingStatus(guardResult.status)
      const title = ok
        ? hasGuard
          ? 'Transaction guard is active'
          : 'No transaction guard in use'
        : hasGuard
          ? 'Transaction guard is unverified'
          : 'Transaction guard is recommended'
      items.push({
        key: 'guard',
        severity: guardResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(guardResult)}
            title={title}
            expandedContent={buildExpanded(guardResult, buildCta('guard', guardResult, safeQueryParam))}
          />
        ),
      })
    }

    const fallbackResult = results['fallback_handler']
    if (fallbackResult) {
      const ok = isPassingStatus(fallbackResult.status)
      // Scanner emits a human label like "Official Safe fallback handler" / "CoW Protocol TWAP handler"
      // in evidence — reuse it directly so the title auto-matches each variant.
      const handlerLabel = fallbackResult.evidence?.find(
        (e): e is { label: string; value: string } => typeof e !== 'string' && e.label === 'Status',
      )?.value
      const title = ok
        ? hasFallback
          ? handlerLabel || 'Fallback handler is active'
          : 'No fallback handler in use'
        : 'Fallback handler is unverified'
      items.push({
        key: 'fallback',
        severity: fallbackResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(fallbackResult)}
            title={title}
            expandedContent={buildExpanded(
              fallbackResult,
              buildCta('fallback_handler', fallbackResult, safeQueryParam),
            )}
          />
        ),
      })
    }

    const modulesResult = results['modules']
    if (modulesResult) {
      if (activeModules.length === 0) {
        items.push({
          key: 'modules-empty',
          severity: modulesResult.severity,
          isPassing: isPassingStatus(modulesResult.status),
          node: (
            <Row
              leadIcon={iconFor(modulesResult)}
              title="No modules installed"
              expandedContent={buildExpanded(modulesResult, buildCta('modules', modulesResult, safeQueryParam))}
            />
          ),
        })
      } else if (showModuleSummary) {
        // Collapsed summary row — not expandable, acts as a gateway to per-module rows.
        items.push({
          key: 'modules-summary',
          severity: modulesResult.severity,
          isPassing: isPassingStatus(modulesResult.status),
          node: (
            <Row
              leadIcon={iconFor(modulesResult)}
              title={`Modules & Extensions · ${activeModules.length} installed`}
              trailing={
                <Button
                  size="small"
                  variant="text"
                  onClick={(e) => {
                    e.stopPropagation()
                    setModulesExpanded(true)
                  }}
                  sx={{ fontSize: '0.7rem', p: 0, minWidth: 0, textTransform: 'none', fontWeight: 600 }}
                >
                  View all
                </Button>
              }
            />
          ),
        })
      } else {
        const modulesCta = buildCta('modules', modulesResult, safeQueryParam)
        activeModules.forEach((mod) => {
          const trusted = isKnownModuleByName(mod.name)
          const severity: SecurityGrade = trusted ? 'Low' : 'High'
          const status: ScanResult['status'] = trusted ? 'clear' : 'issue'
          // Show the module's name as the title for both trusted and unrecognized modules — users
          // need to identify *which* module when it's flagged. The icon + intro convey the verdict.
          const title = mod.name || shortenAddress(mod.value)
          const perModuleEvidence: EvidenceItem[] = [
            { label: 'Address', value: mod.value },
            ...(mod.name ? [{ label: 'Name', value: mod.name }] : []),
          ]
          const intro = trusted
            ? 'Recognized Safe ecosystem module.'
            : "Unrecognized module — not in the known Safe ecosystem deployments. Review carefully and remove if you don't recognize it."
          items.push({
            key: `module-${mod.value}`,
            severity,
            isPassing: trusted,
            node: (
              <Row
                leadIcon={<StatusIcon status={status} />}
                title={title}
                expandedContent={
                  <EvidenceList intro={intro} evidence={perModuleEvidence} cta={trusted ? null : modulesCta} />
                }
              />
            ),
          })
        })
      }
    }

    const scanningResult = results['transaction_scanning']
    if (scanningResult) {
      const ok = isPassingStatus(scanningResult.status)
      const title = ok ? 'Transaction scanning is enabled' : 'Transaction scanning is disabled'
      items.push({
        key: 'scanning',
        severity: scanningResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(scanningResult)}
            title={title}
            expandedContent={buildExpanded(
              scanningResult,
              buildCta('transaction_scanning', scanningResult, safeQueryParam),
            )}
          />
        ),
      })
    }

    const pendingResult = results['pending_tx']
    if (pendingResult) {
      const ok = isPassingStatus(pendingResult.status)
      const queued = scanContext.queuedTxCount
      const title = ok
        ? queued > 0
          ? 'Queue is up to date'
          : 'No pending transactions'
        : 'Pending transactions are stale'
      items.push({
        key: 'pending',
        severity: pendingResult.severity,
        isPassing: ok,
        node: (
          <Row
            leadIcon={iconFor(pendingResult)}
            title={title}
            expandedContent={buildExpanded(pendingResult, buildCta('pending_tx', pendingResult, safeQueryParam))}
          />
        ),
      })
    }

    return {
      failingRows: sortBySeverity(items.filter((i) => !i.isPassing)).map(({ key, node }) => ({ key, node })),
      passingRows: items.filter((i) => i.isPassing).map(({ key, node }) => ({ key, node })),
    }
  }, [buildCta, isKnownModuleByName, zeroAddress, scanContext, results, safeQueryParam, modulesExpanded])

  if (!security.$isReady || !buildCta) {
    return { isReady: false, failingRows: [], passingRows: [] }
  }

  return { isReady: true, failingRows, passingRows }
}
