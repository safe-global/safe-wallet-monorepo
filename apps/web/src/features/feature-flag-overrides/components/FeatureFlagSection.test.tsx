import { render } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { FeatureFlagSection } from './FeatureFlagSection'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

const row = (feature: FEATURES): FeatureFlagRowData => ({
  feature,
  chainScope: 'off',
  configValue: false,
  override: undefined,
  effective: false,
  matchesCurrentChain: false,
})

describe('FeatureFlagSection', () => {
  it('renders nothing when there are no rows', () => {
    const { container } = render(<FeatureFlagSection title="All feature flags" rows={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the title, count and rows', () => {
    const { getByText } = render(<FeatureFlagSection title="All feature flags" rows={[row(FEATURES.EARN)]} />)
    expect(getByText('All feature flags')).toBeInTheDocument()
    expect(getByText('1')).toBeInTheDocument()
    expect(getByText(FEATURES.EARN)).toBeInTheDocument()
  })
})
