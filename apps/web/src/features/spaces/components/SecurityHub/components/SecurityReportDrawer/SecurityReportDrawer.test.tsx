import '../../../../../../tests/storybook-setup'
import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import * as stories from './SecurityReportDrawer.stories'

const { OpenWithContext } = composeStories(stories)

const renderOpenDrawer = async () => {
  render(<OpenWithContext />)
  await act(async () => {})
}

describe('SecurityReportDrawer surface', () => {
  it('renders the drawer on a recessed surface, not bg-card, so inner cards stay visible in both themes', async () => {
    await renderOpenDrawer()

    const content = screen.getByLabelText('Security report')

    expect(content).toHaveClass('bg-muted-secondary')
    expect(content).toHaveClass('dark:bg-[var(--color-background-main)]')
    expect(content).not.toHaveClass('bg-card')
  })

  it('renders the Safe name, its shortened address and a close button in the header', async () => {
    await renderOpenDrawer()

    expect(screen.getByText('Operations Vault')).toBeInTheDocument()
    expect(screen.getByText('0xA77D...98b6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })
})
