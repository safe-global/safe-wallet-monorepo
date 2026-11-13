import { useState as mockUseState } from 'react'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { tokenOptionBuilder } from '@/tests/builders/tokenOptions'
import {
  useAddCustomToken as mockUseAddCustomToken,
  useCustomTokens as mockUseCustomTokens,
} from '@/features/spending-limits'
import NewSpendingLimitFlow from '..'

jest.mock('../../../TxFlow', () => ({
  TxFlow: ({ children }: { children: React.ReactNode }) => {
    const [isOnCreateStep, setIsOnCreateStep] = mockUseState(true)
    return (
      <div>
        {isOnCreateStep ? children : <MockReviewStep />}
        <button type="button" onClick={() => setIsOnCreateStep((current) => !current)}>
          change step
        </button>
      </div>
    )
  },
}))

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: () => ({ CreateSpendingLimit: MockCreateStep, ReviewSpendingLimit: MockReviewStep }),
}))

const mockCustomToken = tokenOptionBuilder().with({ group: 'custom', symbol: 'NEW' }).build()

const MockCreateStep = () => {
  const addToken = mockUseAddCustomToken()
  return (
    <button type="button" onClick={() => addToken('1', mockCustomToken)}>
      pick custom token
    </button>
  )
}

const MockReviewStep = () => (
  <div data-testid="review-step">
    {mockUseCustomTokens('1')
      .map((token) => token.symbol)
      .join(',')}
  </div>
)

describe('NewSpendingLimitFlow', () => {
  it('keeps a custom token picked on the form for the review step', async () => {
    const { user } = renderWithUserEvent(<NewSpendingLimitFlow />)

    await user.click(screen.getByRole('button', { name: 'pick custom token' }))
    await user.click(screen.getByRole('button', { name: 'change step' }))

    expect(screen.getByTestId('review-step')).toHaveTextContent('NEW')
  })
})
