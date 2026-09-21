import { fireEvent } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { getStoreInstance } from '@/store'
import * as editorData from '../hooks/useFeatureFlagEditorData'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagEditorDialog } from './FeatureFlagEditorDialog'

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

describe('FeatureFlagEditorDialog', () => {
  afterEach(() => jest.restoreAllMocks())

  it('renders nothing while closed', () => {
    mockData([], [row(FEATURES.EARN)])
    const { queryByRole } = render(<FeatureFlagEditorDialog open={false} onOpenChange={jest.fn()} />)
    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the title and the editor body when open', () => {
    mockData([], [row(FEATURES.EARN)])
    const { getByRole, getByLabelText } = render(<FeatureFlagEditorDialog open onOpenChange={jest.fn()} />)

    expect(getByRole('heading', { name: 'Feature flags' })).toBeInTheDocument()
    expect(getByLabelText('Search flags')).toBeInTheDocument()
  })

  it('disables "Reset all overrides" when there are no overrides', () => {
    mockData([], [row(FEATURES.EARN)])
    const { getByRole } = render(<FeatureFlagEditorDialog open onOpenChange={jest.fn()} />)
    expect(getByRole('button', { name: 'Reset all overrides' })).toBeDisabled()
  })

  it('clears all overrides in the store on reset', () => {
    mockData([row(FEATURES.EARN, true)], [])
    const { getByRole } = render(<FeatureFlagEditorDialog open onOpenChange={jest.fn()} />, {
      initialReduxState: { featureFlagOverrides: { [FEATURES.EARN]: true } },
    })

    const resetButton = getByRole('button', { name: 'Reset all overrides' })
    expect(resetButton).toBeEnabled()

    fireEvent.click(resetButton)

    expect(getStoreInstance().getState().featureFlagOverrides).toEqual({})
  })

  it('closes via the Done button', () => {
    mockData([], [row(FEATURES.EARN)])
    const onOpenChange = jest.fn()
    const { getByRole } = render(<FeatureFlagEditorDialog open onOpenChange={onOpenChange} />)

    fireEvent.click(getByRole('button', { name: 'Done' }))

    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0][0]).toBe(false)
  })
})
