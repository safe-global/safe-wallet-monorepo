import { fireEvent, waitFor } from '@testing-library/react'

import { render } from '@/tests/test-utils'
import { RecoveryInProgressCard } from '../RecoveryInProgressCard'
import { useRecoveryTxState } from '@/features/recovery/hooks/useRecoveryTxState'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

jest.mock('@/features/recovery/hooks/useRecoveryTxState')

const mockUseRecoveryTxState = useRecoveryTxState as jest.MockedFunction<typeof useRecoveryTxState>

describe('RecoveryInProgressCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('vertical', () => {
    it('should render executable recovery state correctly', async () => {
      mockUseRecoveryTxState.mockReturnValue({
        isExecutable: true,
        remainingSeconds: 0,
      } as any)

      const mockClose = jest.fn()

      const { queryByText } = render(
        <RecoveryInProgressCard
          orientation="vertical"
          onClose={mockClose}
          recovery={{ validFrom: BigInt(0) } as RecoveryQueueItem}
        />,
      )

      ;['days', 'hrs', 'mins'].forEach((unit) => {
        expect(queryByText(unit)).toBeFalsy()
      })

      expect(queryByText(/Account can be recovered/)).toBeTruthy()
      expect(queryByText('Learn more')).toBeTruthy()

      const queueButton = queryByText('Go to queue')
      expect(queueButton).toBeTruthy()

      fireEvent.click(queueButton!)

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled()
      })
    })

    it('should render the expired state correctly', async () => {
      mockUseRecoveryTxState.mockReturnValue({
        isExecutable: false,
        isExpired: true,
        remainingSeconds: 0,
      } as any)

      const mockClose = jest.fn()

      const { queryByText } = render(
        <RecoveryInProgressCard
          orientation="vertical"
          onClose={mockClose}
          recovery={{ validFrom: BigInt(0) } as RecoveryQueueItem}
        />,
      )

      ;['days', 'hrs', 'mins'].forEach((unit) => {
        expect(queryByText(unit)).toBeFalsy()
      })

      expect(queryByText(/Account recovery expired/)).toBeTruthy()
      expect(queryByText(/The pending recovery proposal has expired/)).toBeTruthy()
      expect(queryByText('Learn more')).toBeTruthy()

      const queueButton = queryByText('Go to queue')
      expect(queueButton).toBeTruthy()

      fireEvent.click(queueButton!)

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled()
      })
    })

    it('should render non-executable recovery state correctly', async () => {
      mockUseRecoveryTxState.mockReturnValue({
        isExecutable: false,
        remainingSeconds: 420 * 69 * 1337,
      } as any)

      const mockClose = jest.fn()

      const { queryByText } = render(
        <RecoveryInProgressCard
          orientation="vertical"
          onClose={mockClose}
          recovery={{ validFrom: BigInt(0) } as RecoveryQueueItem}
        />,
      )

      expect(queryByText(/Account recovery in progress/)).toBeTruthy()
      expect(queryByText(/The recovery process has started/)).toBeTruthy()
      ;['days', 'hrs', 'mins'].forEach((unit) => {
        expect(queryByText(unit)).toBeTruthy()
      })
      expect(queryByText('Learn more')).toBeTruthy()

      const queueButton = queryByText('Go to queue')
      expect(queueButton).toBeTruthy()

      fireEvent.click(queueButton!)

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled()
      })
    })
  })
  describe('horizontal', () => {
    it('should render executable recovery state correctly', () => {
      mockUseRecoveryTxState.mockReturnValue({
        isExecutable: true,
        remainingSeconds: 0,
      } as any)

      const { queryByText } = render(
        <RecoveryInProgressCard orientation="horizontal" recovery={{ validFrom: BigInt(0) } as RecoveryQueueItem} />,
      )

      ;['days', 'hrs', 'mins'].forEach((unit) => {
        expect(queryByText(unit)).toBeFalsy()
      })

      expect(queryByText(/Account can be recovered/)).toBeTruthy()
      expect(queryByText('Learn more')).toBeTruthy()
      expect(queryByText('Go to queue')).toBeTruthy()
    })

    it('should render the expired state correctly', async () => {
      mockUseRecoveryTxState.mockReturnValue({
        isExecutable: false,
        isExpired: true,
        remainingSeconds: 0,
      } as any)

      const { queryByText } = render(
        <RecoveryInProgressCard orientation="horizontal" recovery={{ validFrom: BigInt(0) } as RecoveryQueueItem} />,
      )

      ;['days', 'hrs', 'mins'].forEach((unit) => {
        expect(queryByText(unit)).toBeFalsy()
      })

      expect(queryByText(/Account recovery expired/)).toBeTruthy()
      expect(queryByText(/The pending recovery proposal has expired/)).toBeTruthy()
      expect(queryByText('Learn more')).toBeTruthy()
      expect(queryByText('Go to queue')).toBeTruthy()
    })

    it('should render non-executable recovery state correctly', () => {
      mockUseRecoveryTxState.mockReturnValue({
        isExecutable: false,
        remainingSeconds: 420 * 69 * 1337,
      } as any)

      const { queryByText } = render(
        <RecoveryInProgressCard orientation="horizontal" recovery={{ validFrom: BigInt(0) } as RecoveryQueueItem} />,
      )

      expect(queryByText(/Account recovery in progress/)).toBeTruthy()
      expect(queryByText(/The recovery process has started/)).toBeTruthy()
      ;['days', 'hrs', 'mins'].forEach((unit) => {
        expect(queryByText(unit)).toBeTruthy()
      })
      expect(queryByText('Learn more')).toBeTruthy()
      expect(queryByText('Go to queue')).toBeTruthy()
    })
  })
})
