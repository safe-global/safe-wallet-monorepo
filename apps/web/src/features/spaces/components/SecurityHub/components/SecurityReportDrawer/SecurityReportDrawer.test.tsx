import '../../../../../../tests/storybook-setup'
import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'

import * as stories from './SecurityReportDrawer.stories'

const { OpenWithContext } = composeStories(stories)

describe('SecurityReportDrawer surface', () => {
  it('renders the drawer on a recessed surface, not bg-card, so inner cards stay visible in both themes', () => {
    render(<OpenWithContext />)

    const content = screen.getByLabelText('Security report')

    expect(content).toHaveClass('bg-zinc-50')
    expect(content).toHaveClass('dark:bg-[var(--color-background-main)]')
    expect(content).not.toHaveClass('bg-card')
  })
})
