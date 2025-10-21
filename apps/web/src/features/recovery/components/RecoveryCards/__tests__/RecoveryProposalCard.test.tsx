import { faker } from '@faker-js/faker'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import { fireEvent, render } from '@/tests/test-utils'
import { InternalRecoveryProposalCard } from '../RecoveryProposalCard'

describe('RecoveryProposalCard', () => {
  describe('vertical', () => {
    it('should render correctly', () => {
      const mockClose = jest.fn()
      const mockSetTxFlow = jest.fn()

      const { queryByText } = render(
        <InternalRecoveryProposalCard
          orientation="vertical"
          onClose={mockClose}
          safe={{ owners: [{ value: faker.finance.ethereumAddress() }] } as SafeState}
          setTxFlow={mockSetTxFlow}
        />,
      )

      expect(queryByText('Recover this Account')).toBeTruthy()
      expect(
        queryByText(
          'The connected wallet was chosen as a trusted Recoverer. You can help the owner regain access by resetting the Account setup.',
        ),
      ).toBeTruthy()
      expect(queryByText('Learn more')).toBeTruthy()

      const recoveryButton = queryByText('Start recovery')
      expect(recoveryButton).toBeTruthy()

      fireEvent.click(recoveryButton!)

      expect(mockClose).toHaveBeenCalled()
      expect(mockSetTxFlow).toHaveBeenCalled()
    })
  })
  describe('horizontal', () => {})
  it('should render correctly', () => {
    const mockSetTxFlow = jest.fn()

    const { queryByText } = render(
      <InternalRecoveryProposalCard
        orientation="horizontal"
        safe={{ owners: [{ value: faker.finance.ethereumAddress() }] } as SafeState}
        setTxFlow={mockSetTxFlow}
      />,
    )

    expect(queryByText('Recover this Account')).toBeTruthy()
    expect(
      queryByText(
        'The connected wallet was chosen as a trusted Recoverer. You can help the owner regain access by resetting the Account setup.',
      ),
    ).toBeTruthy()
    expect(queryByText('Learn more')).toBeTruthy()

    const recoveryButton = queryByText('Start recovery')
    expect(recoveryButton).toBeTruthy()

    fireEvent.click(recoveryButton!)

    expect(mockSetTxFlow).toHaveBeenCalled()
  })
})
