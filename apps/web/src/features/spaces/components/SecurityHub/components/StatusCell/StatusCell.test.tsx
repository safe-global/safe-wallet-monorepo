import { fireEvent, render, screen } from '@testing-library/react'
import { AppRoutes } from '@/config/routes'
import StatusCell from './StatusCell'

describe('StatusCell', () => {
  describe('null grade', () => {
    it('renders a skeleton when scanning', () => {
      const { container } = render(<StatusCell grade={null} isScanning />)
      expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
    })

    it('renders a dash when not scanning', () => {
      render(<StatusCell grade={null} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('passing grade', () => {
    it('renders a bare "Healthy" chip with the matching aria-label', () => {
      render(<StatusCell grade="passing" count={0} />)
      const chip = screen.getByLabelText('Healthy')
      expect(chip).toHaveTextContent('Healthy')
      expect(chip).not.toHaveTextContent(/0 issues/)
    })
  })

  describe('non-passing grades', () => {
    it.each([
      ['critical', 4, 'Critical · 4 issues found'],
      ['at_risk', 3, 'At risk · 3 issues found'],
      ['needs_attention', 2, 'Needs review · 2 issues found'],
    ] as const)('renders "%s · %s" with the count + label (count > 1)', (grade, count, expected) => {
      render(<StatusCell grade={grade} count={count} />)
      expect(screen.getByText(expected)).toBeInTheDocument()
      expect(screen.getByLabelText(expected)).toBeInTheDocument()
    })

    it('singularises the label when count is 1 ("1 issue found")', () => {
      render(<StatusCell grade="at_risk" count={1} />)
      expect(screen.getByText('At risk · 1 issue found')).toBeInTheDocument()
    })

    it('falls back to the Healthy chip if count is 0 even with a non-passing grade (defensive) and warns in dev', () => {
      // Should never happen in production (computeSummary and getSafeGrade agree), but the
      // guard prevents a nonsense "At risk · 0 issues found" reading if they ever desync.
      // The dev-only console.warn surfaces the underlying bug instead of silently degrading.
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      render(<StatusCell grade="at_risk" count={0} />)
      expect(screen.getByLabelText('Healthy')).toBeInTheDocument()
      expect(screen.queryByText(/At risk/)).not.toBeInTheDocument()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('grade=at_risk but count=0'))
      warn.mockRestore()
    })
  })

  describe('update link', () => {
    const updateHref = { pathname: AppRoutes.settings.setup, query: { safe: 'eth:0x1234' } }

    it('renders an Update link to Settings → Setup next to the chip', () => {
      render(<StatusCell grade="passing" count={0} updateHref={updateHref} />)
      expect(screen.getByLabelText('Healthy')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: 'Update contracts' })
      expect(link).toHaveTextContent('Update')
      expect(link).toHaveAttribute('href', expect.stringContaining(AppRoutes.settings.setup))
    })

    it('stops the click from reaching the row', () => {
      const onRowClick = jest.fn()
      render(
        <div onClick={onRowClick}>
          <StatusCell grade="passing" count={0} updateHref={updateHref} />
        </div>,
      )
      fireEvent.click(screen.getByRole('link', { name: 'Update contracts' }))
      expect(onRowClick).not.toHaveBeenCalled()
    })

    it('renders no link without an updateHref', () => {
      render(<StatusCell grade="passing" count={0} />)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })
})
