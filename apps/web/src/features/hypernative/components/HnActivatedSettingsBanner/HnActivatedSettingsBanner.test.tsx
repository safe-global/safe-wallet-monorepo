import { render, screen } from '@/tests/test-utils'
import { HnActivatedSettingsBanner } from './HnActivatedSettingsBanner'
import { hnActivatedSettingsBannerConfig } from './config'

describe('HnActivatedSettingsBanner', () => {
  it('renders the active settings banner in a shadcn card surface', () => {
    render(<HnActivatedSettingsBanner />)

    const title = screen.getByText(hnActivatedSettingsBannerConfig.title)

    expect(title.closest('[data-slot="card"]')).toHaveClass('p-8')
    expect(screen.getByText(hnActivatedSettingsBannerConfig.description)).toBeInTheDocument()
    expect(screen.getByText(hnActivatedSettingsBannerConfig.statusLabel)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: hnActivatedSettingsBannerConfig.buttonLabel })).toHaveAttribute(
      'href',
      hnActivatedSettingsBannerConfig.dashboardUrl,
    )
  })
})
