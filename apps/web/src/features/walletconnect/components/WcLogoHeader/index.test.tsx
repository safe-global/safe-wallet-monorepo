import { render, screen } from '@testing-library/react'
import WcLogoHeader from '.'
import { BRAND_NAME } from '@/config/constants'

describe('WcLogoHeader component tests', () => {
  it('Verify default header is rendered correctly', () => {
    render(<WcLogoHeader />)

    expect(screen.getByTestId('wc-icon')).toBeVisible()

    const title = screen.getByTestId('wc-title')
    expect(title).toBeVisible()
    expect(title).toHaveTextContent(`Connect dApps to ${BRAND_NAME}`)
    expect(screen.queryByTestId('wc-alert')).not.toBeInTheDocument()
  })

  it('Verify header error state is rendered correctly', () => {
    const errorMessage = 'Connection failed'
    render(<WcLogoHeader errorMessage={errorMessage} />)

    expect(screen.getByTestId('wc-icon')).toBeVisible()
    expect(screen.queryByTestId('wc-alert')).toBeVisible()
    const title = screen.getByTestId('wc-title')
    expect(title).toBeVisible()
    expect(title).toHaveTextContent(errorMessage)
  })
})
