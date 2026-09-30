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
    const { container } = render(<FeatureFlagSection title="All feature flags" rows={[]} valueLabel="Remote value" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the title, count and rows', () => {
    const { getByText } = render(
      <FeatureFlagSection title="All feature flags" rows={[row(FEATURES.EARN)]} valueLabel="Remote value" />,
    )
    expect(getByText('All feature flags')).toBeInTheDocument()
    expect(getByText('1')).toBeInTheDocument()
    expect(getByText(FEATURES.EARN)).toBeInTheDocument()
  })

  // The bottom section's switch column shows what the config service delivered, not a local
  // override, so each section labels that column for itself.
  it('labels the value column per section', () => {
    const { getByText, queryByText, rerender } = render(
      <FeatureFlagSection title="All feature flags" rows={[row(FEATURES.EARN)]} valueLabel="Remote value" />,
    )
    expect(getByText('Remote value')).toBeInTheDocument()
    expect(queryByText('Local value')).not.toBeInTheDocument()

    rerender(<FeatureFlagSection title="Local overrides" rows={[row(FEATURES.EARN)]} valueLabel="Local value" />)
    expect(getByText('Local value')).toBeInTheDocument()
    expect(queryByText('Remote value')).not.toBeInTheDocument()
  })
})
