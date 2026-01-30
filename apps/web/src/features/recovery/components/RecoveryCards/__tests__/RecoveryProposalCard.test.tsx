import { fireEvent, render } from '@/tests/test-utils'
import { InternalRecoveryProposalCard } from '../RecoveryProposalCard'

describe('RecoveryProposalCard', () => {
  describe('vertical', () => {
    it('should render correctly', () => {
      const mockClose = jest.fn()
      const mockSetTxFlow = jest.fn()

      const { queryByText } = render(
        <InternalRecoveryProposalCard orientation="vertical" onClose={mockClose} setTxFlow={mockSetTxFlow} />,
      )

      expect(queryByText(/Recover this account\./)).toBeTruthy()
      expect(queryByText('Your connected wallet can help you regain access by adding a new signer.')).toBeTruthy()
      expect(queryByText('Learn more')).toBeTruthy()

      const recoveryButton = queryByText('Start recovery')
      expect(recoveryButton).toBeTruthy()

      fireEvent.click(recoveryButton!)

      expect(mockClose).toHaveBeenCalled()
      expect(mockSetTxFlow).toHaveBeenCalled()
    })
  })
  describe('horizontal', () => {
    it('should render correctly', () => {
      const mockSetTxFlow = jest.fn()

      const { queryByText } = render(
        <InternalRecoveryProposalCard orientation="horizontal" setTxFlow={mockSetTxFlow} />,
      )

      expect(queryByText(/Recover this account\./)).toBeTruthy()
      expect(queryByText('Your connected wallet can help you regain access by adding a new signer.')).toBeTruthy()

      const recoveryButton = queryByText('Start recovery')
      expect(recoveryButton).toBeTruthy()

      fireEvent.click(recoveryButton!)

      expect(mockSetTxFlow).toHaveBeenCalled()
    })
  })
})
