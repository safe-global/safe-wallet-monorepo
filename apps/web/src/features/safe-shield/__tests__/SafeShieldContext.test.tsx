import { renderHook, waitFor, act } from '@testing-library/react'
import {
  SafeShieldProvider,
  useSafeShield,
  useSafeShieldForAddressPoisoning,
  useSafeShieldForDraftTx,
} from '../SafeShieldContext'
import { toGuardCheckCalls } from '../utils/toGuardCheckCalls'
import { RecipientStatus, Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import {
  DeadlockAnalysisBuilder,
  DeadlockAnalysisResultBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { safeSignatureBuilder, safeTxBuilder } from '@/tests/builders/safeTx'
import type { ReactNode } from 'react'
import { getAddress } from 'ethers'
import { SafeScopeContext, type SafeScope } from '@safe-global/views/components/tx-flow/safe-scope'

jest.mock('../hooks', () => ({
  useRecipientAnalysis: jest.fn(() => undefined),
  useCounterpartyAnalysis: jest.fn(() => ({
    recipient: [undefined, undefined, false],
    contract: [undefined, undefined, false],
    deadlock: [undefined, undefined, false],
  })),
  useThreatAnalysis: jest.fn(),
  // Pass-through by default (set in beforeEach); the overlay is covered by its own suite
  useRecipientAnalysisWithPoisoning: jest.fn(),
}))

const mockUseGuardPolicyChecks = jest.fn<{ isAllowed: boolean }, [unknown]>(() => ({ isAllowed: false }))
jest.mock('../hooks/useGuardPolicyChecks', () => ({
  useGuardPolicyChecks: (calls: unknown) => mockUseGuardPolicyChecks(calls),
}))

const mockUseSafeProAccess = jest.fn(() => ({ hasProFeatures: true, isLoading: false }))
jest.mock('@/features/spaces', () => ({ useSafeProAccess: () => mockUseSafeProAccess() }))
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
  setSafeMessageHash: jest.fn(),
  safeMessageHash: undefined,
  safeMessage: undefined,
  setSafeTxError: jest.fn(),
  setNonce: jest.fn(),
  setNonceNeeded: jest.fn(),
  setSafeTxGas: jest.fn(),
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe' as const,
  setGtfPaymentMode: jest.fn(),
  setGtfSelectedGasToken: jest.fn(),
}

const mockUseThreatAnalysis = jest.requireMock('../hooks').useThreatAnalysis
const mockUseRecipientAnalysis = jest.requireMock('../hooks').useRecipientAnalysis
const mockUseCounterpartyAnalysis = jest.requireMock('../hooks').useCounterpartyAnalysis
const mockUseRecipientAnalysisWithPoisoning = jest.requireMock('../hooks').useRecipientAnalysisWithPoisoning

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
    mockUseRecipientAnalysisWithPoisoning.mockImplementation((recipient: unknown) => recipient)
    mockUseSafeProAccess.mockReturnValue({ hasProFeatures: true, isLoading: false })
  })

  describe('policy guard check', () => {
    const draftTx = buildSafeTransaction('0xa9059cbb')

    it('checks a draft before a transaction is built', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <SafeTxContext.Provider value={mockSafeTxContextValue}>
          <SafeShieldProvider>{children}</SafeShieldProvider>
        </SafeTxContext.Provider>
      )

      renderHook(() => useSafeShieldForDraftTx(draftTx), { wrapper })

      expect(mockUseGuardPolicyChecks).toHaveBeenLastCalledWith(toGuardCheckCalls(draftTx))
    })

    it('checks the built transaction instead of the draft', () => {
      const builtTx = buildSafeTransaction('0x8d80ff0a')
      const wrapper = ({ children }: { children: ReactNode }) => (
        <SafeTxContext.Provider value={{ ...mockSafeTxContextValue, safeTx: builtTx }}>
          <SafeShieldProvider>{children}</SafeShieldProvider>
        </SafeTxContext.Provider>
      )

      renderHook(() => useSafeShieldForDraftTx(draftTx), { wrapper })

      expect(mockUseGuardPolicyChecks).toHaveBeenLastCalledWith(toGuardCheckCalls(builtTx))
    })

    it('clears the draft when the flow drops it', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <SafeTxContext.Provider value={mockSafeTxContextValue}>
          <SafeShieldProvider>{children}</SafeShieldProvider>
        </SafeTxContext.Provider>
      )

      const { rerender } = renderHook(({ tx }) => useSafeShieldForDraftTx(tx), {
        wrapper,
        initialProps: { tx: draftTx as SafeTransaction | undefined },
      })
      rerender({ tx: undefined })

      expect(mockUseGuardPolicyChecks).toHaveBeenLastCalledWith(undefined)
    })
  })

  describe('Safe Pro gating', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeTxContext.Provider value={mockSafeTxContextValue}>
        <SafeShieldProvider>{children}</SafeShieldProvider>
      </SafeTxContext.Provider>
    )

    it('runs the recipient and counterparty analyses for a Workspace with Safe Pro', () => {
      mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))
      const { result } = renderHook(() => useSafeShield(), { wrapper })
      const tx = buildSafeTransaction('0x1234')
      act(() => {
        result.current.setSafeTx(tx)
        result.current.setRecipientAddresses(['0x00000000000000000000000000000000000000aa'])
      })

      expect(result.current.hasProFeatures).toBe(true)
      expect(mockUseRecipientAnalysis).toHaveBeenLastCalledWith(['0x00000000000000000000000000000000000000aa'])
      expect(mockUseCounterpartyAnalysis).toHaveBeenLastCalledWith(tx, true)
    })

    it('keeps only the threat analysis without Safe Pro: no recipient addresses, counterparty disabled', () => {
      mockUseSafeProAccess.mockReturnValue({ hasProFeatures: false, isLoading: false })
      mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))
      const { result } = renderHook(() => useSafeShield(), { wrapper })
      const tx = buildSafeTransaction('0x1234')
      act(() => {
        result.current.setSafeTx(tx)
        result.current.setRecipientAddresses(['0x00000000000000000000000000000000000000aa'])
      })

      expect(result.current.hasProFeatures).toBe(false)
      expect(mockUseRecipientAnalysis).toHaveBeenLastCalledWith(undefined)
      expect(mockUseCounterpartyAnalysis).toHaveBeenLastCalledWith(tx, false)
      expect(mockUseThreatAnalysis).toHaveBeenCalled()
    })

    it('locks nothing in a Workspace-level flow until it picks a Safe, then gates on Safe Pro', () => {
      mockUseSafeProAccess.mockReturnValue({ hasProFeatures: false, isLoading: false })
      mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.OK))
      const scopeWrapper = (scope: SafeScope | undefined) =>
        function ScopeWrapper({ children }: { children: ReactNode }) {
          return (
            <SafeScopeContext.Provider value={{ scope, setScope: jest.fn(), clearScope: jest.fn() }}>
              {wrapper({ children })}
            </SafeScopeContext.Provider>
          )
        }

      const beforePick = renderHook(() => useSafeShield(), { wrapper: scopeWrapper(undefined) })
      expect(beforePick.result.current.hasProFeatures).toBe(true)

      const afterPick = renderHook(() => useSafeShield(), { wrapper: scopeWrapper({} as SafeScope) })
      expect(afterPick.result.current.hasProFeatures).toBe(false)
    })
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

  it('keeps risk confirmation when the same transaction is reloaded with signatures', async () => {
    mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.CRITICAL))

    const createdTx = safeTxBuilder().build()
    const reloadedTx = safeTxBuilder()
      .with({ data: { ...createdTx.data, to: getAddress(createdTx.data.to) } })
      .build()
    reloadedTx.addSignature(safeSignatureBuilder().build())

    let contextSafeTx = createdTx
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeTxContext.Provider value={{ ...mockSafeTxContextValue, safeTx: contextSafeTx }}>
        <SafeShieldProvider>{children}</SafeShieldProvider>
      </SafeTxContext.Provider>
    )

    const { result, rerender } = renderHook(() => useSafeShield(), { wrapper })

    await waitFor(() => {
      expect(result.current.needsRiskConfirmation).toBe(true)
    })

    act(() => {
      result.current.setIsRiskConfirmed(true)
    })

    contextSafeTx = reloadedTx
    rerender()

    expect(result.current.safeTx).toBe(reloadedTx)
    expect(result.current.isRiskConfirmed).toBe(true)
  })

  describe('risk confirmation after a late analysis result', () => {
    const noDeadlock = { recipient: [undefined, undefined, false], contract: [undefined, undefined, false] }

    // A critical threat needs the confirmation; the deadlock analysis arrives after the user confirmed.
    function renderConfirmed(initialDeadlock: unknown) {
      mockUseThreatAnalysis.mockReturnValue(buildThreatResult(Severity.CRITICAL))
      let deadlock = initialDeadlock
      mockUseCounterpartyAnalysis.mockImplementation(() => ({ ...noDeadlock, deadlock }))
      const tx = buildSafeTransaction('0x1234')
      const wrapper = ({ children }: { children: ReactNode }) => (
        <SafeTxContext.Provider value={{ ...mockSafeTxContextValue, safeTx: tx }}>
          <SafeShieldProvider>{children}</SafeShieldProvider>
        </SafeTxContext.Provider>
      )
      // isRiskConfirmed of every render, to catch a render that shows a stale confirmation
      const confirmations: boolean[] = []
      const rendered = renderHook(
        () => {
          const shield = useSafeShield()
          confirmations.push(shield.isRiskConfirmed)
          return shield
        },
        { wrapper },
      )
      act(() => {
        rendered.result.current.setIsRiskConfirmed(true)
      })
      const deliver = (next: unknown) => {
        deadlock = next
        rendered.rerender()
      }
      return { ...rendered, deliver, confirmations }
    }

    it('keeps the confirmation when a non-critical result arrives', () => {
      const { result, deliver } = renderConfirmed([undefined, undefined, true])

      deliver(DeadlockAnalysisBuilder.nestedSafeWarning())

      expect(result.current.needsRiskConfirmation).toBe(true)
      expect(result.current.isRiskConfirmed).toBe(true)
    })

    it('keeps the confirmation when the same findings arrive as new objects', () => {
      const { result, deliver } = renderConfirmed(DeadlockAnalysisBuilder.deadlockDetected())

      deliver(DeadlockAnalysisBuilder.deadlockDetected())

      expect(result.current.isRiskConfirmed).toBe(true)
    })

    it('asks again when a new critical finding arrives', () => {
      const { result, deliver } = renderConfirmed([undefined, undefined, true])

      deliver(DeadlockAnalysisBuilder.deadlockDetected())

      expect(result.current.needsRiskConfirmation).toBe(true)
      expect(result.current.isRiskConfirmed).toBe(false)
    })

    it('never renders a new critical finding as confirmed', () => {
      const { deliver, confirmations } = renderConfirmed([undefined, undefined, true])
      const rendersBefore = confirmations.length

      deliver(DeadlockAnalysisBuilder.deadlockDetected())

      expect(confirmations.slice(rendersBefore)).not.toContain(true)
    })

    it('keeps the confirmation of a transaction whose findings come back unchanged', () => {
      const { result, deliver } = renderConfirmed(DeadlockAnalysisBuilder.deadlockDetected())

      deliver([undefined, undefined, true])
      expect(result.current.isRiskConfirmed).toBe(false)
      deliver(DeadlockAnalysisBuilder.deadlockDetected())

      expect(result.current.isRiskConfirmed).toBe(true)
    })
  })

  it('should require risk confirmation for critical deadlock', async () => {
    mockUseThreatAnalysis.mockReturnValue([undefined, undefined, false])
    mockUseCounterpartyAnalysis.mockReturnValue({
      recipient: [undefined, undefined, false],
      contract: [undefined, undefined, false],
      deadlock: DeadlockAnalysisBuilder.deadlockDetected(),
    })

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

  it('should require risk confirmation when multi-send has CRITICAL deadlock across addresses', async () => {
    mockUseThreatAnalysis.mockReturnValue([undefined, undefined, false])

    const multiAddressDeadlock = new DeadlockAnalysisBuilder()
      .addAddress(
        '0x0000000000000000000000000000000000000001',
        DeadlockAnalysisResultBuilder.nestedSafeWarning().build(),
      )
      .addAddress(
        '0x0000000000000000000000000000000000000002',
        DeadlockAnalysisResultBuilder.deadlockDetected().build(),
      )
      .build()

    mockUseCounterpartyAnalysis.mockReturnValue({
      recipient: [undefined, undefined, false],
      contract: [undefined, undefined, false],
      deadlock: multiAddressDeadlock,
    })

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
      },
      { timeout: 3000 },
    )
  })

  it('should not require risk confirmation for warn deadlock', async () => {
    mockUseThreatAnalysis.mockReturnValue([undefined, undefined, false])
    mockUseCounterpartyAnalysis.mockReturnValue({
      recipient: [undefined, undefined, false],
      contract: [undefined, undefined, false],
      deadlock: DeadlockAnalysisBuilder.nestedSafeWarning(),
    })

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

  it('registers poisoning-only addresses for the overlay', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeTxContext.Provider value={mockSafeTxContextValue}>
        <SafeShieldProvider>{children}</SafeShieldProvider>
      </SafeTxContext.Provider>
    )

    const addresses = ['0x00000000000000000000000000000000000000bb']
    renderHook(() => useSafeShieldForAddressPoisoning(addresses), { wrapper })

    await waitFor(() => {
      expect(mockUseRecipientAnalysisWithPoisoning).toHaveBeenLastCalledWith(expect.anything(), addresses)
    })
  })

  it('should require risk confirmation for a CRITICAL address-poisoning match', async () => {
    mockUseThreatAnalysis.mockReturnValue([undefined, undefined, false])
    mockUseRecipientAnalysisWithPoisoning.mockImplementation(() => [
      {
        '0x00000000000000000000000000000000000000cc': {
          [StatusGroup.ADDRESS_POISONING]: [
            {
              severity: Severity.CRITICAL,
              type: RecipientStatus.RESEMBLES_TRUSTED_ADDRESS,
              title: 'Potential address poisoning',
              description: 'test',
            },
          ],
        },
      },
      undefined,
      false,
    ])

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SafeTxContext.Provider value={mockSafeTxContextValue}>
        <SafeShieldProvider>{children}</SafeShieldProvider>
      </SafeTxContext.Provider>
    )

    const { result } = renderHook(() => useSafeShield(), { wrapper })

    await waitFor(
      () => {
        expect(result.current.needsRiskConfirmation).toBe(true)
        expect(result.current.isRiskConfirmed).toBe(false)
      },
      { timeout: 3000 },
    )
  })
})
