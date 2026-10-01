import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import type { SafenetCheckPhase } from '../types'
import { SafenetShieldPill } from './SafenetShieldPill'

const LandsAfterAMoment = ({ phase }: { phase: SafenetCheckPhase }) => {
  const [current, setCurrent] = useState<SafenetCheckPhase>('checking')
  useEffect(() => {
    const id = setTimeout(() => setCurrent(phase), 1200)
    return () => clearTimeout(id)
  }, [phase])
  return <SafenetShieldPill phase={current} />
}

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetShieldPill',
  component: SafenetShieldPill,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Safe Shield mark under the panel. Outline while Safenet runs; fills and draws its glyph when the result lands. The "Lands" stories replay the transition after 1.2s.',
      },
    },
  },
  tags: ['skip-visual-test'],
} satisfies Meta<typeof SafenetShieldPill>

export default meta
type Story = StoryObj<typeof meta>

export const Checking: Story = { args: { phase: 'checking' } }
export const NoIssuesFound: Story = { args: { phase: 'no-issues' } }
export const RiskDetected: Story = { args: { phase: 'risk' } }
export const Unavailable: Story = { args: { phase: 'unavailable' } }
export const LandsNoIssues: Story = {
  args: { phase: 'no-issues' },
  render: (args) => <LandsAfterAMoment phase={args.phase!} />,
}
export const LandsRisk: Story = { args: { phase: 'risk' }, render: (args) => <LandsAfterAMoment phase={args.phase!} /> }
