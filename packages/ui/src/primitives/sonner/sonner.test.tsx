import { act, render, screen } from '@testing-library/react'
import { toast } from 'sonner'
import { Toaster } from './sonner'

describe('Toaster', () => {
  it('renders without a theme provider and forwards the theme', async () => {
    render(<Toaster theme="dark" />)

    act(() => {
      toast('Saved')
    })

    expect(await screen.findByText('Saved')).toBeInTheDocument()
    expect(document.querySelector('[data-sonner-toaster]')).toHaveAttribute('data-sonner-theme', 'dark')
  })

  it('defaults to the system theme', async () => {
    render(<Toaster />)

    act(() => {
      toast('Default theme')
    })

    await screen.findByText('Default theme')
    expect(document.querySelector('[data-sonner-toaster]')).toHaveAttribute('data-sonner-theme', 'light')
  })
})
