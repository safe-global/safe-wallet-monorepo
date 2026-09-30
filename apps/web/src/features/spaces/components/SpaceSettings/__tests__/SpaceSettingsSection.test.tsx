import { render, screen } from '@testing-library/react'
import SpaceSettingsSection, { SpaceSettingsSectionTitle } from '../SpaceSettingsSection'

describe('SpaceSettingsSection', () => {
  it('renders the shared settings surface as a semantic card section', () => {
    render(<SpaceSettingsSection aria-label="Workspace identity">Identity content</SpaceSettingsSection>)

    const section = screen.getByRole('region', { name: 'Workspace identity' })
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveAttribute('data-slot', 'card')
  })

  it('renders section titles through Typography', () => {
    render(<SpaceSettingsSectionTitle>Workspace title</SpaceSettingsSectionTitle>)

    expect(screen.getByText('Workspace title')).toHaveAttribute('data-slot', 'typography')
  })
})
