import { fireEvent, render, screen } from '@testing-library/react'
import { SidebarBannerCarousel } from '../SidebarBannerCarousel'

describe('SidebarBannerCarousel', () => {
  it('renders nothing without banners', () => {
    const { container } = render(
      <SidebarBannerCarousel>
        {false}
        {null}
      </SidebarBannerCarousel>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a single banner without controls', () => {
    render(
      <SidebarBannerCarousel>
        <div>Only banner</div>
      </SidebarBannerCarousel>,
    )

    expect(screen.getByText('Only banner')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the first banner and one dot per banner', () => {
    render(
      <SidebarBannerCarousel>
        <div>First</div>
        {false}
        <div>Second</div>
      </SidebarBannerCarousel>,
    )

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.queryByText('Second')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('sidebar-banner-carousel-dot')).toHaveLength(2)
  })

  it('moves forward with Next and wraps around', () => {
    render(
      <SidebarBannerCarousel>
        <div>First</div>
        <div>Second</div>
      </SidebarBannerCarousel>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Next banner' }))
    expect(screen.getByText('Second')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next banner' }))
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('moves backward with Previous and wraps around', () => {
    render(
      <SidebarBannerCarousel>
        <div>First</div>
        <div>Second</div>
      </SidebarBannerCarousel>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous banner' }))

    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('falls back to the last remaining banner when the active one disappears', () => {
    const { rerender } = render(
      <SidebarBannerCarousel>
        <div>First</div>
        <div>Second</div>
      </SidebarBannerCarousel>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Next banner' }))
    expect(screen.getByText('Second')).toBeInTheDocument()

    rerender(
      <SidebarBannerCarousel>
        <div>First</div>
        {false}
      </SidebarBannerCarousel>,
    )

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
