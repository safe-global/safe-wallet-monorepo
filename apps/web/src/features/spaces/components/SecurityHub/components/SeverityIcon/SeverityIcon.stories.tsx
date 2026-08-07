import type { Meta, StoryObj } from '@storybook/react'
import { Stack } from '@mui/material'
import { GRADE_TONE, resolveStatusTone, SeverityIcon, STATUS_TONE } from './SeverityIcon'

const meta = {
  title: 'Features/SecurityHub/SeverityIcon',
  component: SeverityIcon,
} satisfies Meta<typeof SeverityIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Clear: Story = { args: { tone: STATUS_TONE.clear } }
export const Partial: Story = { args: { tone: STATUS_TONE.partial } }
export const Issue: Story = { args: { tone: STATUS_TONE.issue } }
export const CriticalIssue: Story = { args: { tone: resolveStatusTone('issue', 'Critical') } }
export const NotApplicable: Story = { args: { tone: STATUS_TONE.not_applicable } }
export const Inconclusive: Story = { args: { tone: STATUS_TONE.inconclusive } }

export const AllGrades: StoryObj = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <SeverityIcon tone={GRADE_TONE.critical} ariaLabel="Critical" />
      <SeverityIcon tone={GRADE_TONE.at_risk} ariaLabel="At risk" />
      <SeverityIcon tone={GRADE_TONE.needs_attention} ariaLabel="Needs review" />
      <SeverityIcon tone={GRADE_TONE.passing} ariaLabel="Healthy" />
    </Stack>
  ),
}
