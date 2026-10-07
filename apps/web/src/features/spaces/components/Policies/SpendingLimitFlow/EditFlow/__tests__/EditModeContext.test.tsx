import { render, screen } from '@/tests/test-utils'
import { EditModeProvider, useIsEditMode } from '../EditModeContext'

const Probe = () => <span data-testid="mode">{String(useIsEditMode())}</span>

describe('useIsEditMode', () => {
  it('reports edit mode under the provider', () => {
    render(
      <EditModeProvider>
        <Probe />
      </EditModeProvider>,
    )

    expect(screen.getByTestId('mode')).toHaveTextContent('true')
  })

  it('stays false without a provider, so the create flow keeps its rules', () => {
    render(<Probe />)

    expect(screen.getByTestId('mode')).toHaveTextContent('false')
  })
})
