import { render } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { FeatureFlagRow } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

const baseRow: FeatureFlagRowData = {
  feature: FEATURES.EARN,
  chainScope: 'global',
  configValue: false,
  override: undefined,
  effective: false,
  matchesCurrentChain: false,
}

describe('FeatureFlagRow', () => {
  it('renders the flag constant', () => {
    const { getByText } = render(<FeatureFlagRow row={baseRow} />)
    expect(getByText(FEATURES.EARN)).toBeInTheDocument()
  })

  it('shows the switch checked when the effective value is true', () => {
    const { getByRole } = render(<FeatureFlagRow row={{ ...baseRow, effective: true }} />)
    expect(getByRole('switch')).toBeChecked()
  })

  it('shows a revert button only for overridden rows', () => {
    const { queryByLabelText, rerender } = render(<FeatureFlagRow row={baseRow} />)
    expect(queryByLabelText('Revert override')).not.toBeInTheDocument()
    rerender(<FeatureFlagRow row={{ ...baseRow, override: true, effective: true }} />)
    expect(queryByLabelText('Revert override')).toBeInTheDocument()
  })

  it('shows the match indicator only when the override matches the current chain config', () => {
    const { queryByLabelText, rerender } = render(
      <FeatureFlagRow row={{ ...baseRow, override: true, effective: true }} />,
    )
    expect(queryByLabelText('Matches config service setting for the current chain')).not.toBeInTheDocument()
    rerender(
      <FeatureFlagRow
        row={{ ...baseRow, override: true, configValue: true, effective: true, matchesCurrentChain: true }}
      />,
    )
    expect(queryByLabelText('Matches config service setting for the current chain')).toBeInTheDocument()
  })
})
