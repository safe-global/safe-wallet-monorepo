import { renderHook, waitFor, act } from '@testing-library/react'
import { SafeShieldProvider, useSafeShield } from '../SafeShieldContext'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { ReactNode } from 'react'

jest.mock('../hooks', () => ({
  useRecipientAnalysis: jest.fn(() => undefined),
  useCounterpartyAnalysis: jest.fn(() => ({
    recipient: [undefined, undefined, false],
    contract: [undefined, undefined, false],
  })),
  useThreatAnalysis: jest.fn(),
}))

// Mock new dependencies for untrusted Safe check
jest.mock('@/hooks/useIsTrustedSafe', () => ({
  __esModule: true,
  default: jest.fn(() => true), // Trusted by default to avoid triggering untrusted warning in existing tests
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    safe: { chainId: '1', owners: [], threshold: 1 },
    safeAddress: '0x1234567890123456789012345678901234567890',
  })),
}))

jest.mock('@/features/myAccounts', () => ({
  useTrustSafe: jest.fn(() => ({ trustSafe: jest.fn() })),
}))

const mockSafeTxContextValue = {
  safeTx: undefined,
  setSafeTx: jest.fn(),
  setSafeMessage: jest.fn(),
  setSafeTxError: jest.fn(),
  setNonce: jest.fn(),
  setNonceNeeded: jest.fn(),
  setSafeTxGas: jest.fn(),
  setTxOrigin: jest.fn(),
  isReadOnly: false,
}

const mockUseThreatAnalysis = jest.requireMock('../hooks').useThreatAnalysis

const buildSafeTransaction = (data: string): SafeTransaction => ({
  addSignature: jest.fn(),
  encodedSignatures: jest.fn(),
  getSignature: jest.fn(),
  signatures: new Map(),
  data: {
    to: '0x00000000000000000000000000000000000000aa',
    value: '0',
    data,
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: 0,
  },
})

const buildThreatResult = (severity: Severity) => [
  {
    [StatusGroup.THREAT]: [
      {
        severity,
        type: ThreatStatus.MALICIOUS,
        title: `${severity} threat detected`,
        description: 'Test threat',
      },
    ],
  },
  undefined,
  false,
]

describe('SafeShieldContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should require risk confirmation for critical threats', async () => {
    mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.CRITICAL))

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeTxContext.Provider value={mockSafeTxContextValue}>
        <SafeShieldProvider>{children}</SafeShieldProvider>
      </SafeTxContext.Provider>
    )

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    const tx = buildSafeTransaction('0x1234')
    act(() => {
      result.current.setSafeTx(tx)
    })

    await waitFor(
      () => {
        expect(result.current.needsRiskConfirmation).toBe(true)
        expect(result.current.isRiskConfirmed).toBe(false)
      },
      { timeout: 3000 },
    )
  })

  it('should not require risk confirmation for OK threats', async () => {
    mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeTxContext.Provider value={mockSafeTxContextValue}>
        <SafeShieldProvider>{children}</SafeShieldProvider>
      </SafeTxContext.Provider>
    )

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    const tx = buildSafeTransaction('0x1234')
    act(() => {
      result.current.setSafeTx(tx)
    })

    await waitFor(
      () => {
        expect(result.current.needsRiskConfirmation).toBe(false)
      },
      { timeout: 3000 },
    )
  })

  it('should reset risk confirmation when transaction changes', async () => {
    mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.CRITICAL))

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeTxContext.Provider value={mockSafeTxContextValue}>
        <SafeShieldProvider>{children}</SafeShieldProvider>
      </SafeTxContext.Provider>
    )

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    const tx1 = buildSafeTransaction('0x1234')
    act(() => {
      result.current.setSafeTx(tx1)
    })

    await waitFor(() => {
      expect(result.current.needsRiskConfirmation).toBe(true)
    })

    act(() => {
      result.current.setIsRiskConfirmed(true)
    })

    expect(result.current.isRiskConfirmed).toBe(true)

    const tx2 = buildSafeTransaction('0x5678')
    act(() => {
      result.current.setSafeTx(tx2)
    })

    await waitFor(() => {
      expect(result.current.isRiskConfirmed).toBe(false)
    })
  })
})
