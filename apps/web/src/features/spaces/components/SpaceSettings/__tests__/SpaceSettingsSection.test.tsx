import { render, screen } from '@testing-library/react'
import SpaceSettingsSection, { SpaceSettingsSectionTitle } from '../SpaceSettingsSection'

describe('SpaceSettingsSection', () => {
  it('renders the shared settings surface as a semantic card section', () => {
    render(<SpaceSettingsSection aria-label="Workspace identity">Identity content</SpaceSettingsSection>)

    const section = screen.getByRole('region', { name: 'Workspace identity' })
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveAttribute('data-slot', 'card')
    expect(section).toHaveClass('bg-card')
    expect(section).toHaveClass('rounded-2xl')
    expect(section).toHaveClass('p-6')
    expect(section).toHaveClass('mb-3')
    expect(section).toHaveClass('gap-0')
  })

  it('renders section titles through Typography without ad-hoc tracking overrides', () => {
    render(<SpaceSettingsSectionTitle>Workspace title</SpaceSettingsSectionTitle>)

    const title = screen.getByText('Workspace title')
    expect(title).toHaveAttribute('data-slot', 'typography')
    expect(title).toHaveClass('mb-5')
    expect(title.className).not.toContain('tracking-')
  })
})
