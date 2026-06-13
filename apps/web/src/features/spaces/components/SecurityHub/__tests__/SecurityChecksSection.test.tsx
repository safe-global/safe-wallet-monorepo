import type { ReactNode } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { AppRoutes } from '@/config/routes'
import { createMockContext } from '@/features/security/testing'
import type { ScanResult } from '@/features/security/types'
import SecurityChecksSection from '../components/SecurityPanelView/SecurityChecksSection'

// next/link isn't meaningful in a jsdom render; pass through to a plain anchor.
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
  MockLink.displayName = 'MockLink'
  return { __esModule: true, default: MockLink }
})

// useLoadFeature depends on Redux/chain context which isn't wired in this unit test.
// Return the resolved feature synchronously so components see $isReady=true.
// require() inside the factory since jest.mock is hoisted above ES imports.
jest.mock('@/features/__core__', () => {
  const securityFeatureImpl = require('@/features/security/feature').default
  return {
    ...jest.requireActual('@/features/__core__'),
    useLoadFeature: () => ({
      ...securityFeatureImpl,
      $isReady: true,
      $isDisabled: false,
      $error: undefined,
    }),
  }
})

// ─── helpers ──────────────────────────────────────────────────────────────────

type PartialResult = Partial<ScanResult> & Pick<ScanResult, 'status' | 'severity'>

const mkResult = (r: PartialResult): ScanResult => ({
  score: r.status === 'clear' ? 100 : 30,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
  ...r,
})

const allClearResults: Record<string, ScanResult> = {
  account_setup: mkResult({ status: 'clear', severity: 'Low' }),
  recovery: mkResult({ status: 'clear', severity: 'Low' }),
  contract_version: mkResult({ status: 'clear', severity: 'Low' }),
  factory_validation: mkResult({ status: 'clear', severity: 'Low' }),
  guard: mkResult({ status: 'clear', severity: 'Low' }),
  fallback_handler: mkResult({
    status: 'clear',
    severity: 'Low',
    evidence: [{ label: 'Status', value: 'Official Safe fallback handler' }],
  }),
  modules: mkResult({ status: 'clear', severity: 'Low' }),
  transaction_scanning: mkResult({ status: 'clear', severity: 'Low' }),
  pending_tx: mkResult({ status: 'clear', severity: 'Low' }),
  multichain_setup: mkResult({ status: 'not_applicable', severity: 'Low' }),
}

const SAFE_QUERY_PARAM = 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'

/**
 * Renders SecurityChecksSection with sensible defaults. Explicitly setting a key
 * to `undefined` DOES override the default — use this to test missing-prop cases.
 */
const renderPanel = (overrides: Partial<React.ComponentProps<typeof SecurityChecksSection>> = {}) => {
  const defaults: React.ComponentProps<typeof SecurityChecksSection> = {
    scanContext: createMockContext(),
    results: allClearResults,
    safeQueryParam: SAFE_QUERY_PARAM,
  }
  return render(<SecurityChecksSection {...defaults} {...overrides} />)
}

/** Find the collapsible "Healthy · N" passing-group chip. */
const getChecksAccordion = () => screen.getByText(/^Healthy · \d+$/)

// ─── tests ────────────────────────────────────────────────────────────────────

describe('SecurityChecksSection', () => {
  describe('Security checks bucketing', () => {
    it('surfaces failing checks at the top and shows a passing-accordion summary', () => {
      renderPanel({
        results: {
          ...allClearResults,
          contract_version: mkResult({ status: 'issue', severity: 'High', remediation: 'Update.' }),
        },
      })
      // Failing check visible by its non-OK title
      expect(screen.getByText('Contract version is outdated')).toBeInTheDocument()
      // Accordion summary for the remaining passing checks
      expect(getChecksAccordion()).toBeInTheDocument()
    })

    it('reveals passing rows inside the accordion when it is toggled open', () => {
      renderPanel()
      // Everything passes — accordion holds all rows. Open it.
      fireEvent.click(getChecksAccordion())
      // Declarative titles for passing checks should now be in the DOM
      expect(screen.getByText('Signing threshold is strong')).toBeInTheDocument()
      expect(screen.getByText('Contract version is up to date')).toBeInTheDocument()
      expect(screen.getByText('Deployed via official Safe factory')).toBeInTheDocument()
    })

    it('sorts failing rows by severity (Critical → High → Medium)', () => {
      renderPanel({
        scanContext: createMockContext({ threshold: 1 }),
        results: {
          ...allClearResults,
          pending_tx: mkResult({ status: 'partial', severity: 'Medium', remediation: 'x' }),
          contract_version: mkResult({ status: 'issue', severity: 'High', remediation: 'x' }),
          account_setup: mkResult({ status: 'issue', severity: 'Critical', remediation: 'x' }),
        },
      })
      const criticalEl = screen.getByText('Single signer controls this Safe')
      const highEl = screen.getByText('Contract version is outdated')
      const mediumEl = screen.getByText('Pending transactions are stale')

      // Critical before High in DOM order
      expect(criticalEl.compareDocumentPosition(highEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      // High before Medium in DOM order
      expect(highEl.compareDocumentPosition(mediumEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  describe('failing-row CTA', () => {
    it("renders a CTA link pointing to the scanner's fix route", () => {
      renderPanel({
        results: {
          ...allClearResults,
          contract_version: mkResult({ status: 'issue', severity: 'High', remediation: 'Update.' }),
        },
      })
      // Expand the failing row
      fireEvent.click(screen.getByText('Contract version is outdated'))
      const link = screen.getByRole('link', { name: /update/i })
      expect(link).toHaveAttribute('href', expect.stringContaining(AppRoutes.settings.setup))
      expect(link).toHaveAttribute('href', expect.stringContaining('safe='))
    })

    it('honors ScanResult.ctaLabelOverride over the CHECK_DEFS default', () => {
      renderPanel({
        results: {
          ...allClearResults,
          guard: mkResult({
            status: 'partial',
            severity: 'Medium',
            remediation: 'Guard recommended.',
            ctaLabelOverride: 'Review modules',
          }),
        },
      })
      fireEvent.click(screen.getByText('Transaction guard is recommended'))
      expect(screen.getByRole('link', { name: /review modules/i })).toBeInTheDocument()
    })

    it('does not render a CTA when safeQueryParam is missing', () => {
      renderPanel({
        safeQueryParam: undefined,
        results: {
          ...allClearResults,
          contract_version: mkResult({ status: 'issue', severity: 'High', remediation: 'Update.' }),
        },
      })
      fireEvent.click(screen.getByText('Contract version is outdated'))
      expect(screen.queryByRole('link', { name: /update/i })).not.toBeInTheDocument()
    })
  })

  describe('multichain row', () => {
    it('promotes a failing multichain check into the top "needs attention" area', () => {
      renderPanel({
        results: {
          ...allClearResults,
          multichain_setup: mkResult({ status: 'partial', severity: 'Medium', remediation: 'Align signers.' }),
        },
      })
      expect(screen.getByText('Signers differ across networks')).toBeInTheDocument()
    })

    it('shows a passing multichain row inside the passing-checks accordion', () => {
      renderPanel({
        results: { ...allClearResults, multichain_setup: mkResult({ status: 'clear', severity: 'Low' }) },
      })
      fireEvent.click(getChecksAccordion())
      expect(screen.getByText('Signers are consistent across networks')).toBeInTheDocument()
    })

    it('hides the multichain row entirely when not applicable (single-chain Safe)', () => {
      renderPanel()
      fireEvent.click(getChecksAccordion())
      expect(screen.queryByText('Signers are consistent across networks')).not.toBeInTheDocument()
      expect(screen.queryByText('Signers differ across networks')).not.toBeInTheDocument()
    })
  })

  describe('fallback handler', () => {
    it('uses the scanner-emitted Status label as the title when passing', () => {
      renderPanel()
      fireEvent.click(getChecksAccordion())
      // Title + evidence both contain this label; assert at least one match exists.
      expect(screen.getAllByText('Official Safe fallback handler').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('modules', () => {
    it('collapses to a summary row when more than 2 modules are installed', () => {
      renderPanel({
        scanContext: createMockContext({
          modules: [
            { value: '0xaaaa000000000000000000000000000000000001', name: 'Delay Module' },
            { value: '0xaaaa000000000000000000000000000000000002', name: 'Allowance Module' },
            { value: '0xaaaa000000000000000000000000000000000003', name: 'Scope Guard' },
          ],
        }),
      })
      fireEvent.click(getChecksAccordion())
      expect(screen.getByText(/Modules & Extensions · 3 installed/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view all/i })).toBeInTheDocument()
    })

    it('shows unrecognized modules as failing rows (visible without expanding accordion)', () => {
      renderPanel({
        scanContext: createMockContext({
          modules: [{ value: '0xbbbb000000000000000000000000000000000002', name: 'Mystery Module' }],
        }),
      })
      // Unrecognized module → failing → visible at top under its grade group, without expanding
      // the passing accordion. The row title flags it; the module name lives in the expanded evidence.
      expect(screen.getByText('Unrecognized module detected')).toBeInTheDocument()
    })

    it('labels a recognized module by name and routes it to the passing rows', () => {
      renderPanel({
        scanContext: createMockContext({
          modules: [{ value: '0xaaaa000000000000000000000000000000000001', name: 'Delay Modifier' }],
        }),
      })
      // Recognized module → passing → hidden until the "Healthy" accordion is expanded.
      fireEvent.click(getChecksAccordion())
      expect(screen.getByText('Recognized module · Delay Modifier')).toBeInTheDocument()
      expect(screen.queryByText('Unrecognized module detected')).not.toBeInTheDocument()
    })

    describe('vulnerable Zodiac modules', () => {
      const DELAY = '0xcccc000000000000000000000000000000000001'

      it('flags a vulnerable module as Critical with a working remove CTA', () => {
        const onRemoveModule = jest.fn()
        renderPanel({
          scanContext: createMockContext({ modules: [{ value: DELAY, name: 'Delay Modifier' }] }),
          results: {
            ...allClearResults,
            modules: mkResult({
              status: 'issue',
              severity: 'Critical',
              remediation: 'Remove it.',
              vulnerableModules: [DELAY],
              ctaLabelOverride: 'Remove unsupported module',
            }),
          },
          onRemoveModule,
        })

        const row = screen.getByText('Vulnerable module · Delay Modifier')
        fireEvent.click(row)
        const button = screen.getByRole('button', { name: /remove unsupported module/i })
        fireEvent.click(button)
        expect(onRemoveModule).toHaveBeenCalledWith(DELAY)
      })

      it('falls back to an external link when no remove handler is provided', () => {
        renderPanel({
          scanContext: createMockContext({ modules: [{ value: DELAY, name: 'Delay Modifier' }] }),
          results: {
            ...allClearResults,
            modules: mkResult({
              status: 'issue',
              severity: 'Critical',
              vulnerableModules: [DELAY],
              ctaLabelOverride: 'Remove unsupported module',
            }),
          },
        })

        fireEvent.click(screen.getByText('Vulnerable module · Delay Modifier'))
        expect(screen.getByRole('link', { name: /check affected safes/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /remove unsupported module/i })).not.toBeInTheDocument()
      })

      it('renders a Critical warning without a remove button for the nested (no removable module) case', () => {
        const onRemoveModule = jest.fn()
        renderPanel({
          scanContext: createMockContext({ modules: [{ value: DELAY, name: 'Mystery Module' }] }),
          results: {
            ...allClearResults,
            modules: mkResult({ status: 'issue', severity: 'Critical', vulnerableModules: [] }),
          },
          onRemoveModule,
        })

        // Affected, but no module matched as removable → a single warning row, no remove button.
        expect(screen.getByText('Vulnerable module detected')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /remove unsupported module/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('row expansion', () => {
    it('reveals evidence + remediation when a failing row is clicked', () => {
      renderPanel({
        scanContext: createMockContext({ threshold: 1 }),
        results: {
          ...allClearResults,
          account_setup: mkResult({
            status: 'issue',
            severity: 'Critical',
            remediation: 'Raise the threshold.',
            evidence: [
              { label: 'Signers', value: '3' },
              { label: 'Threshold', value: '1 of 3' },
            ],
          }),
        },
      })
      const row = screen.getByText('Single signer controls this Safe')
      fireEvent.click(row)
      const panel = row.closest('.rounded-lg')!
      expect(within(panel as HTMLElement).getByText('Raise the threshold.')).toBeInTheDocument()
      expect(within(panel as HTMLElement).getByText('1 of 3')).toBeInTheDocument()
    })
  })
})
