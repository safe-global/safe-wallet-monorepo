import { render, screen } from '@testing-library/react'
import { ProgressBar } from './index'

describe('ProgressBar', () => {
  it('keeps the legacy secondary intent on the shadcn indicator', () => {
    render(<ProgressBar color="secondary" value={50} />)

    expect(screen.getByLabelText('Progress').querySelector('[data-slot="progress-indicator"]')).toHaveClass(
      'bg-[var(--color-secondary-main)]',
    )
  })

  it('leaves the default indicator styling intact for the primary intent', () => {
    render(<ProgressBar color="primary" value={50} />)

    expect(screen.getByLabelText('Progress').querySelector('[data-slot="progress-indicator"]')).not.toHaveClass(
      'bg-[var(--color-secondary-main)]',
    )
  })
})
