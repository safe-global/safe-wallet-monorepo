import { render, screen } from '@/tests/test-utils'
import PolicyCallout from '../PolicyCallout'
import { CALLOUT_DESCRIPTION_SINGULAR } from '../constants'
import { limitSummaryBuilder, policySummaryBuilder, spenderSummaryBuilder } from '../testBuilders'

describe('PolicyCallout', () => {
  it('renders the plain-language title and description for the policy', () => {
    const alice = spenderSummaryBuilder()
      .with({ name: 'Alice', limits: [limitSummaryBuilder().with({ resetTimeMin: '0' }).build()] })
      .build()
    const policy = policySummaryBuilder()
      .with({ spenders: [alice] })
      .build()

    render(<PolicyCallout policy={policy} />)

    const callout = screen.getByTestId('policy-summary-callout')
    expect(callout).toHaveTextContent('You are giving Alice a one-time spending limit.')
    expect(callout).toHaveTextContent(CALLOUT_DESCRIPTION_SINGULAR)
  })
})
