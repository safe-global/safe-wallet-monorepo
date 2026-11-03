import '../../../../../../tests/storybook-setup'
import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'

import * as stories from './SecurityReportDrawer.stories'
import type { useSecurityScan } from '@/features/security'

jest.mock('@/features/security/hooks/useSecurityScan', () => ({
  __esModule: true,
  default: jest.fn((): ReturnType<typeof useSecurityScan> => ({
    results: {},
    loading: {},
    errors: {},
    isComplete: false,
    lastScannedAt: null,
    progress: 0,
    rescan: jest.fn(),
  })),
}))

const { OpenWithContext } = composeStories(stories)

describe('SecurityReportDrawer surface', () => {
  it('renders the drawer on a recessed surface, not bg-card, so inner cards stay visible in both themes', () => {
    render(<OpenWithContext />)

    const content = screen.getByLabelText('Security report')

    expect(content).toHaveClass('bg-muted-secondary')
    expect(content).toHaveClass('dark:bg-[var(--color-background-main)]')
    expect(content).not.toHaveClass('bg-card')
  })

  it('renders the Safe name, its shortened address and a close button in the header', () => {
    render(<OpenWithContext />)

    expect(screen.getByText('Operations Vault')).toBeInTheDocument()
    expect(screen.getByText('0xA77D...98b6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })
})
