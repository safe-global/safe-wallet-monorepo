import { fireEvent } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { getStoreInstance } from '@/store'
import * as editorData from '../hooks/useFeatureFlagEditorData'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagEditor } from './FeatureFlagEditor'

const row = (feature: FEATURES, override?: boolean): FeatureFlagRowData => ({
  feature,
  chainScope: 'off',
  configValue: false,
  override,
  effective: override ?? false,
  matchesCurrentChain: false,
})

const mockData = (overridden: FeatureFlagRowData[], rest: FeatureFlagRowData[]) =>
  jest.spyOn(editorData, 'useFeatureFlagEditorData').mockReturnValue({ overridden, rest })

describe('FeatureFlagEditor', () => {
  afterEach(() => jest.restoreAllMocks())

  it('filters rows by the search query', () => {
    mockData([], [row(FEATURES.EARN), row(FEATURES.BRIDGE)])
    const { getByLabelText, getByText, queryByText } = render(<FeatureFlagEditor />)

    expect(getByText(FEATURES.EARN)).toBeInTheDocument()
    expect(getByText(FEATURES.BRIDGE)).toBeInTheDocument()

    fireEvent.change(getByLabelText('Search flags'), { target: { value: 'earn' } })

    expect(getByText(FEATURES.EARN)).toBeInTheDocument()
    expect(queryByText(FEATURES.BRIDGE)).not.toBeInTheDocument()
  })

  it('disables "Reset all overrides" when there are no overrides', () => {
    mockData([], [row(FEATURES.EARN)])
    const { getByRole } = render(<FeatureFlagEditor />)
    expect(getByRole('button', { name: 'Reset all overrides' })).toBeDisabled()
  })

  it('omits the local overrides section when there are none', () => {
    mockData([], [row(FEATURES.EARN)])
    const { queryByText } = render(<FeatureFlagEditor />)
    expect(queryByText('Local overrides')).not.toBeInTheDocument()
    expect(queryByText('All feature flags')).toBeInTheDocument()
  })

  it('clears all overrides in the store on reset', () => {
    mockData([row(FEATURES.EARN, true)], [])
    const { getByRole } = render(<FeatureFlagEditor />, {
      initialReduxState: { featureFlagOverrides: { [FEATURES.EARN]: true } },
    })

    const resetButton = getByRole('button', { name: 'Reset all overrides' })
    expect(resetButton).toBeEnabled()

    fireEvent.click(resetButton)

    expect(getStoreInstance().getState().featureFlagOverrides).toEqual({})
  })
})
