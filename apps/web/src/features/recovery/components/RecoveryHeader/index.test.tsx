import { faker } from '@faker-js/faker'

import { InternalRecoveryHeader, useIsProposalInProgress } from '.'
import { render, renderHook, waitFor } from '@/tests/test-utils'
import store from '@/features/recovery/components/RecoveryContext'
import { RecoveryEvent, recoveryDispatch, RecoveryTxType } from '@/features/recovery/services/recoveryEvents'
import { useRecoveryQueue } from '@/features/recovery/hooks/useRecoveryQueue'

jest.mock('@/features/recovery/hooks/useRecoveryQueue')

const mockUseRecoveryQueue = useRecoveryQueue as jest.MockedFunction<typeof useRecoveryQueue>

describe('RecoveryHeader', () => {
  beforeEach(() => {
    store.setStore({ state: [] } as any)
  })

  it('should render the in-progress widget if there is a queue for recoverers', () => {
    const queue = [{ validFrom: BigInt(0) }] as any
    store.setStore({ state: [[{ queue }]] } as any)

    const { queryByText } = render(<InternalRecoveryHeader isProposalInProgress={false} isRecoverer queue={queue} />)

    expect(queryByText(/Account recovery in progress/)).toBeTruthy()
  })

  it('should render the proposal widget when there is no queue for recoverers', () => {
    const queue = [] as any
    store.setStore({ state: [[{ queue }]] } as any)

    const { queryByText } = render(<InternalRecoveryHeader isProposalInProgress={false} isRecoverer queue={queue} />)

    expect(queryByText(/Recover this account\./)).toBeTruthy()
  })

  it('should not render the proposal widget when there is no queue for recoverers and proposal is in progress', () => {
    const queue = [] as any
    store.setStore({ state: [[{ queue }]] } as any)

    const { container } = render(<InternalRecoveryHeader isProposalInProgress isRecoverer queue={queue} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('useIsProposalInProgress', () => {
  ;[RecoveryEvent.PROCESSING, RecoveryEvent.REVERTED, RecoveryEvent.PROCESSED, RecoveryEvent.FAILED].forEach(
    (event) => {
      it('should return true if there is a proposal in progress', async () => {
        mockUseRecoveryQueue.mockReturnValue([] as any)

        const { result } = renderHook(() => useIsProposalInProgress())

        expect(result.current).toBe(false)

        recoveryDispatch(event, {
          moduleAddress: faker.finance.ethereumAddress(),
          txHash: faker.string.hexadecimal(),
          recoveryTxHash: faker.string.hexadecimal(),
          txType: RecoveryTxType.PROPOSAL,
        })

        await waitFor(() => {
          expect(result.current).toBe(true)
        })
      })
    },
  )
  ;[RecoveryEvent.REVERTED, RecoveryEvent.PROCESSED, RecoveryEvent.FAILED].forEach((event) => {
    it('should return false if there is not a proposal in progress and it is not in the queue', async () => {
      const payload = {
        moduleAddress: faker.finance.ethereumAddress(),
        txHash: faker.string.hexadecimal(),
        recoveryTxHash: faker.string.hexadecimal(),
        txType: RecoveryTxType.PROPOSAL,
      }

      mockUseRecoveryQueue.mockReturnValue([{ args: { txHash: payload.recoveryTxHash } }] as any)

      const { result } = renderHook(() => useIsProposalInProgress())

      expect(result.current).toBe(false)

      // Trigger pending
      recoveryDispatch(RecoveryEvent.PROCESSING, payload)

      await waitFor(() => {
        expect(result.current).toBe(true)
      })

      recoveryDispatch(event, payload)

      await waitFor(() => {
        expect(result.current).toBe(false)
      })
    })
  })
})
