import { render } from '@testing-library/react'
import ClassicViewWarningBorder, { CLASSIC_VIEW_WARNING_BORDER_TEST_ID } from '.'
import * as useClassicView from '@/hooks/useClassicView'

jest.mock('@/hooks/useClassicView', () => ({
  useIsClassicViewActive: jest.fn(),
}))

describe('ClassicViewWarningBorder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the warning border when classic view is active', () => {
    ;(useClassicView.useIsClassicViewActive as jest.Mock).mockReturnValue(true)

    const { getByTestId } = render(<ClassicViewWarningBorder />)

    expect(getByTestId(CLASSIC_VIEW_WARNING_BORDER_TEST_ID)).toBeInTheDocument()
  })

  it('renders nothing when classic view is inactive', () => {
    ;(useClassicView.useIsClassicViewActive as jest.Mock).mockReturnValue(false)

    const { queryByTestId } = render(<ClassicViewWarningBorder />)

    expect(queryByTestId(CLASSIC_VIEW_WARNING_BORDER_TEST_ID)).not.toBeInTheDocument()
  })
})
