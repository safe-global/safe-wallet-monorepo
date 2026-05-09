import { screen, waitFor } from '@testing-library/react'

import { render } from '../test-utils'
import Header from './Header'

describe('<Header>', () => {
  it('Renders Header component', async () => {
    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('Transaction Builder')).toBeInTheDocument()
    })
  })

  it('Shows Link to Transaction Library in Create Batch pathname', async () => {
    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('Transaction Builder')).toBeInTheDocument()
      expect(
        screen.getByText('Your transaction library', {
          exact: false,
        }),
      ).toBeInTheDocument()
    })
  })
})
