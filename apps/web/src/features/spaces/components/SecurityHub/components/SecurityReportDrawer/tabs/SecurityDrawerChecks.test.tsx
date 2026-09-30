import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { createMockContext } from '@/features/security/testing'
import type { ScanResult } from '@/features/security/types'
import SecurityDrawerChecks from './SecurityDrawerChecks'

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
  MockLink.displayName = 'MockLink'
  return { __esModule: true, default: MockLink }
})

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

const mkResult = (status: ScanResult['status'], severity: ScanResult['severity'] = 'Low'): ScanResult => ({
  status,
  severity,
  score: status === 'clear' ? 100 : 30,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
})

const allClearResults: Record<string, ScanResult> = {
  account_setup: mkResult('clear'),
  recovery: mkResult('clear'),
  contract_version: mkResult('clear'),
  factory_validation: mkResult('clear'),
  guard: mkResult('clear'),
  fallback_handler: mkResult('clear'),
  modules: mkResult('clear'),
  transaction_scanning: mkResult('clear'),
  pending_tx: mkResult('clear'),
  multichain_setup: mkResult('not_applicable'),
}

const baseProps = {
  scanContext: createMockContext(),
  results: allClearResults,
  isComplete: true,
  lastScannedAt: Date.now(),
  safeQueryParam: 'eth:0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
}

describe('SecurityDrawerChecks', () => {
  describe('loading / empty guard (4 OR-ed conditions in line 39)', () => {
    it('renders only skeletons when scanContext is null', () => {
      render(<SecurityDrawerChecks {...baseProps} scanContext={null} />)
      // None of the score-card content should be rendered while the guard is active.
      expect(screen.queryByText(/issues found/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Healthy/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Scanned/i)).not.toBeInTheDocument()
    })

    it('renders only skeletons when results are empty AND the scan is still in progress', () => {
      render(<SecurityDrawerChecks {...baseProps} results={{}} isComplete={false} />)
      expect(screen.queryByText(/issues found/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Healthy/i)).not.toBeInTheDocument()
    })

    it('renders the score card once a complete scan has results', () => {
      render(<SecurityDrawerChecks {...baseProps} />)
      // All-clear → header reads "Healthy" (the 0-issue branch).
      expect(screen.getByText('Healthy')).toBeInTheDocument()
      expect(screen.getByText(/Scanned/i)).toBeInTheDocument()
    })

    it('renders "N issues found" with pluralisation when at least one check fails', () => {
      const results = {
        ...allClearResults,
        contract_version: mkResult('issue', 'High'),
        guard: mkResult('partial', 'Medium'),
      }
      render(<SecurityDrawerChecks {...baseProps} results={results} />)
      // 1 issue + 1 partial = 2 non-passing.
      expect(screen.getByText('2 issues found')).toBeInTheDocument()
    })

    it('singularises the count when exactly one check fails', () => {
      const results = {
        ...allClearResults,
        contract_version: mkResult('issue', 'High'),
      }
      render(<SecurityDrawerChecks {...baseProps} results={results} />)
      expect(screen.getByText('1 issue found')).toBeInTheDocument()
    })
  })
})
