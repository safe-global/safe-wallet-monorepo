/**
 * Auto-generated snapshot tests for Storybook stories
 * Run "yarn generate:storybook-tests" to regenerate
 */
import '../../../../tests/storybook-setup'
import { render } from '../../../../tests/test-utils'
import NoFeeCampaignBanner from './index'

describe('./NoFeeCampaignBanner.stories', () => {
  test('Default', () => {
    const { container } = render(<NoFeeCampaignBanner onDismiss={() => {}} />, {
      routerProps: { query: { safe: 'eth:0x0000000000000000000000000000000000000001' } },
    })

    expect(container.firstChild).toMatchSnapshot()
  })
})
